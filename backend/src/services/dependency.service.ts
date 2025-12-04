import * as neo4jQueries from '../db/neo4j/queries';
import { db } from '../db/index';
import { eq } from 'drizzle-orm';
import { mcps, tools, agents, workflows, crossDomainBridges, mcpDependencies } from '../db/schema';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type EntityType = 'domain' | 'subdomain' | 'mcp' | 'tool' | 'agent' | 'workflow' | 'bridge';
export type Action = 'delete' | 'edit' | 'status_change';

export interface EntityRef {
  id: string;
  type: string;
  name: string;
}

export interface HardBlock {
  ruleId: string;
  reason: string;
  message: string;
  affectedEntities: EntityRef[];
}

export interface SoftBlock {
  ruleId: string;
  warning: string;
  impact: string;
  affectedEntities: EntityRef[];
  requiresReason: true;
}

export interface DependencyCheckResult {
  allowed: boolean;
  blockType: 'hard' | 'soft' | 'none';

  hardBlocks: HardBlock[];
  softBlocks: SoftBlock[];

  // For visualization
  dependencyGraph: {
    nodes: neo4jQueries.GraphNode[];
    edges: neo4jQueries.GraphEdge[];
  };

  // For Claude explanation
  contextForAI: {
    entityType: string;
    entityName: string;
    action: string;
    allDependencies: neo4jQueries.DependencyChain | null;
    activeRules: string[];
  };
}

export interface ActionResult {
  success: boolean;
  auditId?: string;
  error?: string;
}

// ============================================
// DEPENDENCY SERVICE
// ============================================

export class DependencyService {
  /**
   * Check if entity can be deleted
   */
  async checkDeleteAllowed(
    entityType: EntityType,
    entityId: string
  ): Promise<DependencyCheckResult> {
    try {
      // Fetch entity details
      const entity = await this.getEntity(entityType, entityId);
      if (!entity) {
        throw new Error(`Entity not found: ${entityType} ${entityId}`);
      }

      // Get dependency information from Neo4j
      let dependencyChain: neo4jQueries.DependencyChain | null = null;
      let dependencyGraph: neo4jQueries.GraphData = { nodes: [], edges: [] };

      try {
        const entityTypeCapitalized = this.capitalizeEntityType(entityType);
        dependencyChain = await neo4jQueries.getDownstreamDependents(
          entityTypeCapitalized,
          entityId
        );
        dependencyGraph = await neo4jQueries.getDependencyGraph(
          entityTypeCapitalized,
          entityId,
          3
        );
      } catch (error) {
        console.warn('Neo4j unavailable, using PostgreSQL only:', error);
      }

      // Evaluate rules
      const hardBlocks = await this.evaluateHardBlocks(entityType, entity, 'delete');
      const softBlocks = await this.evaluateSoftBlocks(entityType, entity, 'delete');

      const allowed = hardBlocks.length === 0;
      const blockType =
        hardBlocks.length > 0 ? 'hard' : softBlocks.length > 0 ? 'soft' : 'none';

      return {
        allowed,
        blockType,
        hardBlocks,
        softBlocks,
        dependencyGraph,
        contextForAI: {
          entityType,
          entityName: entity.name,
          action: 'delete',
          allDependencies: dependencyChain,
          activeRules: [
            ...hardBlocks.map((b) => b.ruleId),
            ...softBlocks.map((b) => b.ruleId),
          ],
        },
      };
    } catch (error: any) {
      console.error('Error checking delete allowed:', error);
      throw error;
    }
  }

  /**
   * Check if entity can be edited
   */
  async checkEditAllowed(
    entityType: EntityType,
    entityId: string,
    proposedChanges: any
  ): Promise<DependencyCheckResult> {
    try {
      const entity = await this.getEntity(entityType, entityId);
      if (!entity) {
        throw new Error(`Entity not found: ${entityType} ${entityId}`);
      }

      // Get dependency information
      let dependencyChain: neo4jQueries.DependencyChain | null = null;
      let dependencyGraph: neo4jQueries.GraphData = { nodes: [], edges: [] };

      try {
        const entityTypeCapitalized = this.capitalizeEntityType(entityType);
        dependencyChain = await neo4jQueries.getDownstreamDependents(
          entityTypeCapitalized,
          entityId
        );
        dependencyGraph = await neo4jQueries.getDependencyGraph(
          entityTypeCapitalized,
          entityId,
          2
        );
      } catch (error) {
        console.warn('Neo4j unavailable, using PostgreSQL only:', error);
      }

      // Evaluate rules for edit
      const hardBlocks = await this.evaluateHardBlocks(entityType, entity, 'edit', proposedChanges);
      const softBlocks = await this.evaluateSoftBlocks(entityType, entity, 'edit', proposedChanges);

      const allowed = hardBlocks.length === 0;
      const blockType =
        hardBlocks.length > 0 ? 'hard' : softBlocks.length > 0 ? 'soft' : 'none';

      return {
        allowed,
        blockType,
        hardBlocks,
        softBlocks,
        dependencyGraph,
        contextForAI: {
          entityType,
          entityName: entity.name,
          action: 'edit',
          allDependencies: dependencyChain,
          activeRules: [
            ...hardBlocks.map((b) => b.ruleId),
            ...softBlocks.map((b) => b.ruleId),
          ],
        },
      };
    } catch (error: any) {
      console.error('Error checking edit allowed:', error);
      throw error;
    }
  }

  /**
   * Check if status change is allowed
   */
  async checkStatusChangeAllowed(
    entityType: EntityType,
    entityId: string,
    newStatus: string
  ): Promise<DependencyCheckResult> {
    const proposedChanges = { status: newStatus };
    return this.checkEditAllowed(entityType, entityId, proposedChanges);
  }

  /**
   * Proceed with action despite soft blocks (requires reason)
   */
  async proceedWithSoftBlock(
    entityType: EntityType,
    entityId: string,
    action: Action,
    reason: string,
    actor: string
  ): Promise<ActionResult> {
    try {
      // Validate reason
      if (!reason || reason.trim().length < 20) {
        return {
          success: false,
          error: 'Reason must be at least 20 characters to override soft block',
        };
      }

      // Re-check to ensure no new hard blocks appeared
      let checkResult: DependencyCheckResult;
      if (action === 'delete') {
        checkResult = await this.checkDeleteAllowed(entityType, entityId);
      } else {
        checkResult = await this.checkEditAllowed(entityType, entityId, {});
      }

      if (checkResult.hardBlocks.length > 0) {
        return {
          success: false,
          error: 'Hard blocks detected. Cannot proceed with override.',
        };
      }

      // Log to audit trail would go here
      console.log(`Override approved by ${actor}: ${reason}`);
      console.log(`Soft blocks overridden:`, checkResult.softBlocks);

      return {
        success: true,
        auditId: 'audit-' + Date.now(), // Would be real audit ID
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ============================================
  // HARD BLOCK RULES (H1-H8)
  // ============================================

  private async evaluateHardBlocks(
    entityType: EntityType,
    entity: any,
    action: Action,
    proposedChanges?: any
  ): Promise<HardBlock[]> {
    const blocks: HardBlock[] = [];

    // H1: BUILT_TOOL_DELETE
    if (entityType === 'tool' && action === 'delete' && entity.status === 'built') {
      blocks.push({
        ruleId: 'H1_BUILT_TOOL_DELETE',
        reason: 'Production tool cannot be deleted',
        message: 'This tool is marked as BUILT, meaning production code may depend on it.',
        affectedEntities: [{ id: entity.id, type: 'tool', name: entity.name }],
      });
    }

    // H2: ACTIVE_AGENT_DELETE
    if (entityType === 'agent' && action === 'delete') {
      if (entity.active && entity.activeInstances > 0) {
        blocks.push({
          ruleId: 'H2_ACTIVE_AGENT_DELETE',
          reason: 'Agent has active instances',
          message: `This agent has ${entity.activeInstances} active instances. Stop all instances before deletion.`,
          affectedEntities: [{ id: entity.id, type: 'agent', name: entity.name }],
        });
      }
    }

    // H3: MCP_HAS_BUILT_TOOLS
    if (entityType === 'mcp' && action === 'delete') {
      const builtTools = await db.query.tools.findMany({
        where: eq(tools.mcpId, entity.id),
      });
      const builtCount = builtTools.filter((t) => t.status === 'built').length;
      if (builtCount > 0) {
        blocks.push({
          ruleId: 'H3_MCP_HAS_BUILT_TOOLS',
          reason: 'MCP contains production tools',
          message: `This MCP contains ${builtCount} built tools that cannot be deleted.`,
          affectedEntities: builtTools
            .filter((t) => t.status === 'built')
            .map((t) => ({ id: t.id, type: 'tool', name: t.name })),
        });
      }
    }

    // H4: CRITICAL_MCP_DEPENDENCY
    if (entityType === 'mcp' && action === 'delete') {
      const criticalDeps = await db.query.mcpDependencies.findMany({
        where: eq(mcpDependencies.targetMcpId, entity.id),
        with: { sourceMcp: true },
      });
      const critical = criticalDeps.filter((d) => d.dependencyType === 'requires');
      if (critical.length > 0) {
        blocks.push({
          ruleId: 'H4_CRITICAL_MCP_DEPENDENCY',
          reason: 'Critical dependency exists',
          message: `${critical[0].sourceMcp.name} has a CRITICAL dependency on this MCP.`,
          affectedEntities: critical.map((d) => ({
            id: d.sourceMcp.id,
            type: 'mcp',
            name: d.sourceMcp.name,
          })),
        });
      }
    }

    // H5: IN_PROGRESS_WORKFLOW_DELETE
    if (entityType === 'workflow' && action === 'delete' && entity.status === 'in-progress') {
      blocks.push({
        ruleId: 'H5_IN_PROGRESS_WORKFLOW_DELETE',
        reason: 'Workflow is in progress',
        message: 'Active workflows cannot be deleted. Complete or archive first.',
        affectedEntities: [{ id: entity.id, type: 'workflow', name: entity.name }],
      });
    }

    // H6: COMPLETED_WORKFLOW_DELETE
    if (entityType === 'workflow' && action === 'delete' && entity.status === 'completed') {
      blocks.push({
        ruleId: 'H6_COMPLETED_WORKFLOW_DELETE',
        reason: 'Completed workflow has audit trail',
        message: 'Completed workflows are archived for compliance. Use archive instead.',
        affectedEntities: [{ id: entity.id, type: 'workflow', name: entity.name }],
      });
    }

    // H7: CRITICAL_BRIDGE_DELETE
    if (entityType === 'bridge' && action === 'delete' && entity.isCritical) {
      blocks.push({
        ruleId: 'H7_CRITICAL_BRIDGE_DELETE',
        reason: 'Critical cross-domain bridge',
        message: 'This is marked as a critical integration point. Removal requires special approval.',
        affectedEntities: [{ id: entity.id, type: 'bridge', name: entity.name }],
      });
    }

    // H8: DOMAIN_HAS_BUILT_CONTENT
    if (entityType === 'domain' && action === 'delete') {
      const subdomainsData = await db.query.subdomains.findMany({
        where: eq(tools.mcpId, entity.id), // This would need proper join
        with: { mcps: { with: { tools: true } } },
      });

      let builtToolsCount = 0;
      let mcpsWithBuiltTools = 0;

      subdomainsData.forEach((subdomain) => {
        subdomain.mcps?.forEach((mcp) => {
          const builtTools = mcp.tools?.filter((t) => t.status === 'built') || [];
          if (builtTools.length > 0) {
            builtToolsCount += builtTools.length;
            mcpsWithBuiltTools++;
          }
        });
      });

      if (builtToolsCount > 0) {
        blocks.push({
          ruleId: 'H8_DOMAIN_HAS_BUILT_CONTENT',
          reason: 'Domain contains production content',
          message: `Cannot delete domain with ${builtToolsCount} built tools across ${mcpsWithBuiltTools} MCPs.`,
          affectedEntities: [{ id: entity.id, type: 'domain', name: entity.name }],
        });
      }
    }

    return blocks;
  }

  // ============================================
  // SOFT BLOCK RULES (S1-S8)
  // ============================================

  private async evaluateSoftBlocks(
    entityType: EntityType,
    entity: any,
    action: Action,
    proposedChanges?: any
  ): Promise<SoftBlock[]> {
    const blocks: SoftBlock[] = [];

    // S1: IN_PROGRESS_TOOL_DELETE
    if (entityType === 'tool' && action === 'delete' && entity.status === 'in-progress') {
      blocks.push({
        ruleId: 'S1_IN_PROGRESS_TOOL_DELETE',
        warning: 'Tool is currently being developed',
        impact: 'Development work will be lost',
        affectedEntities: [{ id: entity.id, type: 'tool', name: entity.name }],
        requiresReason: true,
      });
    }

    // S2: MCP_HAS_DEPENDENTS
    if (entityType === 'mcp' && action === 'delete') {
      const deps = await db.query.mcpDependencies.findMany({
        where: eq(mcpDependencies.targetMcpId, entity.id),
        with: { sourceMcp: true },
      });
      const nonCritical = deps.filter((d) => d.dependencyType !== 'requires');
      if (nonCritical.length > 0) {
        blocks.push({
          ruleId: 'S2_MCP_HAS_DEPENDENTS',
          warning: 'Other MCPs depend on this',
          impact: `${nonCritical.length} MCPs will lose their dependency`,
          affectedEntities: nonCritical.map((d) => ({
            id: d.sourceMcp.id,
            type: 'mcp',
            name: d.sourceMcp.name,
          })),
          requiresReason: true,
        });
      }
    }

    // S3: AGENT_HAS_COLLABORATIONS
    if (entityType === 'agent' && action === 'delete') {
      const collabs = await db.query.agentCollaborations.findMany({
        where: eq(mcpDependencies.targetMcpId, entity.id), // Would need proper agent collab query
      });
      if (collabs.length > 0) {
        blocks.push({
          ruleId: 'S3_AGENT_HAS_COLLABORATIONS',
          warning: 'Agent has collaboration relationships',
          impact: `${collabs.length} collaboration links will be broken`,
          affectedEntities: [],
          requiresReason: true,
        });
      }
    }

    // S4: PLANNED_WORKFLOW_DELETE
    if (entityType === 'workflow' && action === 'delete' && entity.status === 'planned') {
      blocks.push({
        ruleId: 'S4_PLANNED_WORKFLOW_DELETE',
        warning: 'Planned workflow will be removed',
        impact: 'Planning documentation will be lost',
        affectedEntities: [{ id: entity.id, type: 'workflow', name: entity.name }],
        requiresReason: true,
      });
    }

    // S5: AGENT_USED_BY_WORKFLOW
    if (entityType === 'agent' && action === 'delete') {
      const workflowLinks = await db.query.workflowAgents.findMany({
        where: eq(mcpDependencies.targetMcpId, entity.id), // Would need proper query
        with: { workflow: true },
      });
      if (workflowLinks.length > 0) {
        blocks.push({
          ruleId: 'S5_AGENT_USED_BY_WORKFLOW',
          warning: 'Agent is assigned to workflows',
          impact: `${workflowLinks.length} workflows will need agent reassignment`,
          affectedEntities: [],
          requiresReason: true,
        });
      }
    }

    // S6: MCP_USED_BY_WORKFLOW
    if (entityType === 'mcp' && action === 'delete') {
      const workflowLinks = await db.query.workflowMcps.findMany({
        where: eq(mcpDependencies.targetMcpId, entity.id), // Would need proper query
        with: { workflow: true },
      });
      if (workflowLinks.length > 0) {
        blocks.push({
          ruleId: 'S6_MCP_USED_BY_WORKFLOW',
          warning: 'MCP powers active workflows',
          impact: `${workflowLinks.length} workflows will lose MCP assignment`,
          affectedEntities: [],
          requiresReason: true,
        });
      }
    }

    // S7: SUBDOMAIN_HAS_CONTENT
    if (entityType === 'subdomain' && action === 'delete') {
      const mcpsData = await db.query.mcps.findMany({
        where: eq(mcps.subdomainId, entity.id),
      });
      const workflowsData = await db.query.workflows.findMany({
        where: eq(workflows.subdomainId, entity.id),
      });
      if (mcpsData.length > 0 || workflowsData.length > 0) {
        blocks.push({
          ruleId: 'S7_SUBDOMAIN_HAS_CONTENT',
          warning: 'Subdomain contains content',
          impact: `${mcpsData.length} MCPs and ${workflowsData.length} workflows will be deleted`,
          affectedEntities: [],
          requiresReason: true,
        });
      }
    }

    // S8: STATUS_DOWNGRADE
    if (
      (entityType === 'tool' || entityType === 'mcp') &&
      action === 'edit' &&
      proposedChanges?.status
    ) {
      if (entity.status === 'built' && proposedChanges.status !== 'built') {
        blocks.push({
          ruleId: 'S8_STATUS_DOWNGRADE',
          warning: 'Downgrading production status',
          impact: 'This may affect systems expecting this to be production-ready',
          affectedEntities: [{ id: entity.id, type: entityType, name: entity.name }],
          requiresReason: true,
        });
      }
    }

    return blocks;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async getEntity(entityType: EntityType, entityId: string): Promise<any> {
    switch (entityType) {
      case 'domain':
        return db.query.domains.findFirst({ where: eq(tools.mcpId, entityId) });
      case 'subdomain':
        return db.query.subdomains.findFirst({ where: eq(tools.mcpId, entityId) });
      case 'mcp':
        return db.query.mcps.findFirst({ where: eq(mcps.id, entityId) });
      case 'tool':
        return db.query.tools.findFirst({ where: eq(tools.id, entityId) });
      case 'agent':
        return db.query.agents.findFirst({ where: eq(agents.id, entityId) });
      case 'workflow':
        return db.query.workflows.findFirst({ where: eq(workflows.id, entityId) });
      case 'bridge':
        return db.query.crossDomainBridges.findFirst({
          where: eq(crossDomainBridges.id, entityId),
        });
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  private capitalizeEntityType(entityType: EntityType): string {
    const map: Record<EntityType, string> = {
      domain: 'Domain',
      subdomain: 'Subdomain',
      mcp: 'MCP',
      tool: 'Tool',
      agent: 'Agent',
      workflow: 'Workflow',
      bridge: 'CrossDomainBridge',
    };
    return map[entityType];
  }

  /**
   * Generate Claude explanation for blocked action
   */
  async explainWithClaude(checkResult: DependencyCheckResult): Promise<string> {
    // This would integrate with Anthropic SDK
    // For now, return a formatted explanation
    const explanation = [
      `Action: ${checkResult.contextForAI.action} on ${checkResult.contextForAI.entityType} "${checkResult.contextForAI.entityName}"`,
      '',
      checkResult.blockType === 'hard'
        ? '❌ BLOCKED - Cannot proceed'
        : checkResult.blockType === 'soft'
        ? '⚠️  WARNING - Requires justification'
        : '✓ ALLOWED',
      '',
    ];

    if (checkResult.hardBlocks.length > 0) {
      explanation.push('Hard Blocks:');
      checkResult.hardBlocks.forEach((block) => {
        explanation.push(`  • ${block.ruleId}: ${block.message}`);
      });
      explanation.push('');
    }

    if (checkResult.softBlocks.length > 0) {
      explanation.push('Warnings:');
      checkResult.softBlocks.forEach((block) => {
        explanation.push(`  • ${block.ruleId}: ${block.warning}`);
        explanation.push(`    Impact: ${block.impact}`);
      });
    }

    return explanation.join('\n');
  }
}

// Export singleton instance
export const dependencyService = new DependencyService();
