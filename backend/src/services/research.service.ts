import Anthropic from '@anthropic-ai/sdk';
import { db } from '../db/index';
import { researchSessions, researchSuggestions } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { AuditService } from './audit.service';

export type ResearchType = 'mcps' | 'agents' | 'workflows' | 'tools' | 'bridges' | 'comprehensive';
export type SuggestionStatus = 'pending' | 'accepted' | 'rejected' | 'modified';

interface ResearchRequest {
  type: ResearchType;
  domainId?: string;
  subdomainId?: string;
  promptContext?: any;
}

interface ResearchResult {
  sessionId: string;
  analysis: string;
  suggestions: any[];
  metadata: any;
}

export class ResearchService {
  private anthropic: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn('ANTHROPIC_API_KEY not set - ResearchService will use fallback responses');
      this.anthropic = null as any;
    } else {
      this.anthropic = new Anthropic({ apiKey });
    }
  }

  /**
   * Get explanation for a dependency check result
   */
  async explainDependencyCheck(
    entityType: string,
    entityName: string,
    action: string,
    checkResult: any
  ): Promise<string> {
    if (!this.anthropic) {
      return this.getFallbackExplanation(entityType, entityName, action, checkResult);
    }

    try {
      const prompt = `You are an airline operations expert analyzing a system dependency check.

Entity: ${entityName} (${entityType})
Attempted Action: ${action}
Check Result: ${checkResult.allowed ? 'ALLOWED' : 'BLOCKED'}
Block Type: ${checkResult.blockType}

Hard Blocks (Critical Issues):
${checkResult.hardBlocks.map((b: any) => `- ${b.ruleId}: ${b.message}`).join('\n') || 'None'}

Soft Blocks (Warnings):
${checkResult.softBlocks.map((b: any) => `- ${b.ruleId}: ${b.warning} - ${b.impact}`).join('\n') || 'None'}

Dependency Graph Summary:
- Total Nodes: ${checkResult.dependencyGraph.nodes.length}
- Total Edges: ${checkResult.dependencyGraph.edges.length}

Please provide:
1. A clear explanation of why this action was ${checkResult.allowed ? 'allowed' : 'blocked'}
2. The business impact of proceeding or not proceeding
3. Recommended next steps
4. Any risks to consider

Keep the explanation concise (under 300 words) and actionable for airline operations staff.`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (error: any) {
      console.error('Error getting explanation:', error);
      return this.getFallbackExplanation(entityType, entityName, action, checkResult);
    }
  }

  /**
   * Conduct AI research on a specific area
   */
  async conductResearch(
    request: ResearchRequest,
    actor: string
  ): Promise<ResearchResult> {
    try {
      // Create research session
      const [session] = await db
        .insert(researchSessions)
        .values({
          researchType: request.type,
          domainId: request.domainId || null,
          subdomainId: request.subdomainId || null,
          promptContext: request.promptContext ? JSON.parse(JSON.stringify(request.promptContext)) : null,
          actor,
        })
        .returning();

      if (!this.anthropic) {
        // Return mock result if API key not configured
        const mockResult = this.getMockResearchResult(request.type);

        await db
          .update(researchSessions)
          .set({
            responseRaw: JSON.parse(JSON.stringify(mockResult)),
            suggestionsCount: mockResult.suggestions.length,
          })
          .where(eq(researchSessions.id, session.id));

        // Create suggestion records
        for (const suggestion of mockResult.suggestions) {
          await db.insert(researchSuggestions).values({
            sessionId: session.id,
            suggestionType: suggestion.type,
            suggestedData: JSON.parse(JSON.stringify(suggestion)),
            status: 'pending',
          });
        }

        return {
          sessionId: session.id,
          analysis: mockResult.analysis,
          suggestions: mockResult.suggestions,
          metadata: { mock: true },
        };
      }

      // Build prompt for Claude
      const prompt = this.buildResearchPrompt(request);

      // Call Claude API
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Parse Claude's response
      const analysisText = response.content[0].type === 'text' ? response.content[0].text : '';
      const parsedResult = this.parseClaudeResponse(analysisText);

      // Update session with results
      await db
        .update(researchSessions)
        .set({
          responseRaw: JSON.parse(JSON.stringify(parsedResult)),
          suggestionsCount: parsedResult.suggestions.length,
        })
        .where(eq(researchSessions.id, session.id));

      // Create suggestion records
      for (const suggestion of parsedResult.suggestions) {
        await db.insert(researchSuggestions).values({
          sessionId: session.id,
          suggestionType: suggestion.entityType || request.type,
          suggestedData: JSON.parse(JSON.stringify(suggestion)),
          status: 'pending',
        });
      }

      // Log to audit trail
      await AuditService.logResearchAdd(
        'research_session',
        session.id,
        `Research: ${request.type}`,
        actor,
        { type: request.type, suggestionsCount: parsedResult.suggestions.length }
      );

      return {
        sessionId: session.id,
        analysis: parsedResult.analysis,
        suggestions: parsedResult.suggestions,
        metadata: {
          modelUsed: 'claude-3-5-sonnet-20241022',
          tokensUsed: response.usage,
          timestamp: new Date(),
        },
      };
    } catch (error: any) {
      console.error('Error conducting research:', error);
      throw new Error(`Research failed: ${error.message}`);
    }
  }

  /**
   * Accept a research suggestion
   */
  async acceptSuggestion(
    suggestionId: string,
    reviewedBy: string,
    acceptedEntityId?: string
  ): Promise<void> {
    try {
      const suggestion = await db.query.researchSuggestions.findFirst({
        where: eq(researchSuggestions.id, suggestionId),
      });

      if (!suggestion) {
        throw new Error('Suggestion not found');
      }

      await db
        .update(researchSuggestions)
        .set({
          status: 'accepted',
          reviewedBy,
          acceptedEntityId: acceptedEntityId || null,
          reviewedAt: new Date(),
        })
        .where(eq(researchSuggestions.id, suggestionId));

      // Update session accepted count
      const session = await db.query.researchSessions.findFirst({
        where: eq(researchSessions.id, suggestion.sessionId),
      });
      if (session) {
        await db
          .update(researchSessions)
          .set({ acceptedCount: session.acceptedCount + 1 })
          .where(eq(researchSessions.id, suggestion.sessionId));
      }

      await AuditService.logUpdate(
        'research_suggestion',
        suggestionId,
        suggestion.suggestionType,
        reviewedBy,
        { status: 'pending' },
        { status: 'accepted' },
        'Accepted research suggestion'
      );
    } catch (error: any) {
      console.error('Error accepting suggestion:', error);
      throw error;
    }
  }

  /**
   * Reject a research suggestion
   */
  async rejectSuggestion(
    suggestionId: string,
    reviewedBy: string,
    reason: string
  ): Promise<void> {
    try {
      const suggestion = await db.query.researchSuggestions.findFirst({
        where: eq(researchSuggestions.id, suggestionId),
      });

      if (!suggestion) {
        throw new Error('Suggestion not found');
      }

      if (!reason || reason.trim().length < 10) {
        throw new Error('Rejection reason must be at least 10 characters');
      }

      await db
        .update(researchSuggestions)
        .set({
          status: 'rejected',
          reviewedBy,
          modificationNotes: reason,
          reviewedAt: new Date(),
        })
        .where(eq(researchSuggestions.id, suggestionId));

      // Update session rejected count
      const session = await db.query.researchSessions.findFirst({
        where: eq(researchSessions.id, suggestion.sessionId),
      });
      if (session) {
        await db
          .update(researchSessions)
          .set({ rejectedCount: session.rejectedCount + 1 })
          .where(eq(researchSessions.id, suggestion.sessionId));
      }

      await AuditService.logUpdate(
        'research_suggestion',
        suggestionId,
        suggestion.suggestionType,
        reviewedBy,
        { status: 'pending' },
        { status: 'rejected', reason },
        `Rejected: ${reason}`
      );
    } catch (error: any) {
      console.error('Error rejecting suggestion:', error);
      throw error;
    }
  }

  /**
   * Get all research sessions
   */
  async getAllSessions(limit: number = 50): Promise<any[]> {
    try {
      return await db.query.researchSessions.findMany({
        orderBy: [desc(researchSessions.createdAt)],
        limit,
      });
    } catch (error: any) {
      console.error('Error fetching research sessions:', error);
      return [];
    }
  }

  /**
   * Get session details with suggestions
   */
  async getSessionDetails(sessionId: string): Promise<any> {
    try {
      const session = await db.query.researchSessions.findFirst({
        where: eq(researchSessions.id, sessionId),
        with: { suggestions: true },
      });

      if (!session) {
        throw new Error('Session not found');
      }

      return session;
    } catch (error: any) {
      console.error('Error fetching session details:', error);
      throw error;
    }
  }

  /**
   * Get pending suggestions
   */
  async getPendingSuggestions(limit: number = 50): Promise<any[]> {
    try {
      return await db.query.researchSuggestions.findMany({
        where: eq(researchSuggestions.status, 'pending'),
        orderBy: [desc(researchSuggestions.createdAt)],
        limit,
      });
    } catch (error: any) {
      console.error('Error fetching pending suggestions:', error);
      return [];
    }
  }

  /**
   * Build research prompt for Claude
   */
  private buildResearchPrompt(request: ResearchRequest): string {
    return `You are an AI assistant helping design an airline operations system.

Research Type: ${request.type}

Task: Analyze the airline operations domain and provide strategic recommendations for ${request.type}.

Please provide your response in the following JSON format:
{
  "analysis": "Your detailed analysis here (2-3 paragraphs)",
  "suggestions": [
    {
      "entityType": "mcp|agent|workflow|tool",
      "suggestedName": "Name of the suggested entity",
      "reasoning": "Why this is valuable (1-2 sentences)",
      "priority": 1-5,
      "dependencies": ["Optional list of dependencies"]
    }
  ]
}

Focus on:
1. Practical, implementable suggestions
2. Clear business value
3. Integration with existing system
4. Realistic dependencies

Limit to 3-5 high-value suggestions.`;
  }

  /**
   * Parse Claude's response
   */
  private parseClaudeResponse(response: string): { analysis: string; suggestions: any[] } {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          analysis: parsed.analysis || 'No analysis provided',
          suggestions: parsed.suggestions || [],
        };
      }

      return {
        analysis: response,
        suggestions: [],
      };
    } catch (error) {
      console.error('Error parsing Claude response:', error);
      return {
        analysis: response,
        suggestions: [],
      };
    }
  }

  /**
   * Get fallback explanation when Claude is unavailable
   */
  private getFallbackExplanation(
    entityType: string,
    entityName: string,
    action: string,
    checkResult: any
  ): string {
    const lines = [
      `Action: ${action} on ${entityType} "${entityName}"`,
      '',
      checkResult.allowed ? '✓ ALLOWED' : checkResult.blockType === 'hard' ? '❌ BLOCKED' : '⚠️ WARNING',
      '',
    ];

    if (checkResult.hardBlocks.length > 0) {
      lines.push('Hard Blocks:');
      checkResult.hardBlocks.forEach((b: any) => lines.push(`  • ${b.message}`));
      lines.push('');
    }

    if (checkResult.softBlocks.length > 0) {
      lines.push('Warnings:');
      checkResult.softBlocks.forEach((b: any) => lines.push(`  • ${b.warning}`));
    }

    return lines.join('\n');
  }

  /**
   * Get mock research result for testing
   */
  private getMockResearchResult(type: ResearchType): { analysis: string; suggestions: any[] } {
    return {
      analysis: `Mock analysis for ${type}. This is a placeholder response when Claude API is not configured.`,
      suggestions: [
        {
          type,
          entityType: 'mcp',
          suggestedName: `Mock ${type} Suggestion`,
          reasoning: 'This is a mock suggestion for testing purposes',
          priority: 3,
          dependencies: [],
        },
      ],
    };
  }
}
