import { getNeo4jSession, checkNeo4jHealth } from './connection';
import { db } from '../index';
import { Session } from 'neo4j-driver';

interface SyncResult {
  success: boolean;
  nodesCreated: number;
  relationshipsCreated: number;
  errors: string[];
  duration: number;
}

interface IntegrityReport {
  postgresCount: Record<string, number>;
  neo4jCount: Record<string, number>;
  mismatches: string[];
  orphanedNodes: number;
}

export class Neo4jSyncService {
  /**
   * Full sync - mirrors all PostgreSQL data to Neo4j
   * Use for initial load or recovery
   */
  static async fullSync(): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: true,
      nodesCreated: 0,
      relationshipsCreated: 0,
      errors: [],
      duration: 0,
    };

    try {
      // Check Neo4j health first
      const healthy = await checkNeo4jHealth();
      if (!healthy) {
        result.success = false;
        result.errors.push('Neo4j is not available');
        return result;
      }

      console.log('Starting full Neo4j sync...');

      // Sync all entities in dependency order
      await this.syncAllDomains();
      await this.syncAllSubdomains();
      await this.syncAllMCPs();
      await this.syncAllTools();
      await this.syncAllAgentCategories();
      await this.syncAllAgents();
      await this.syncAllWorkflows();

      // Sync all relationships
      await this.syncAllMCPDependencies();
      await this.syncAllCrossDomainBridges();
      await this.syncAllAgentCollaborations();
      await this.syncAllWorkflowMCPs();
      await this.syncAllWorkflowAgents();

      result.duration = Date.now() - startTime;
      console.log(`✓ Full sync completed in ${result.duration}ms`);

      return result;
    } catch (error: any) {
      result.success = false;
      result.errors.push(error.message);
      console.error('Full sync failed:', error);
      return result;
    }
  }

  /**
   * Sync all domains
   */
  private static async syncAllDomains(): Promise<void> {
    const domains = await db.query.domains.findMany();
    for (const domain of domains) {
      await this.syncDomain(domain);
    }
    console.log(`✓ Synced ${domains.length} domains`);
  }

  /**
   * Sync single domain
   */
  static async syncDomain(domain: any): Promise<void> {
    let session: Session | null = null;
    try {
      session = await getNeo4jSession();
      await session.run(
        `
        MERGE (d:Domain {id: $id})
        SET d.name = $name,
            d.icon = $icon,
            d.color = $color
        `,
        {
          id: domain.id,
          name: domain.name,
          icon: domain.icon || '',
          color: domain.color || '#3B82F6',
        }
      );
    } catch (error) {
      console.error(`Error syncing domain ${domain.id}:`, error);
    } finally {
      if (session) await session.close();
    }
  }

  /**
   * Sync all subdomains and their relationships
   */
  private static async syncAllSubdomains(): Promise<void> {
    const subdomains = await db.query.subdomains.findMany({
      with: { domain: true },
    });
    for (const subdomain of subdomains) {
      await this.syncSubdomain(subdomain);
    }
    console.log(`✓ Synced ${subdomains.length} subdomains`);
  }

  /**
   * Sync single subdomain
   */
  static async syncSubdomain(subdomain: any): Promise<void> {
    let session: Session | null = null;
    try {
      session = await getNeo4jSession();

      // Create subdomain node
      await session.run(
        `
        MERGE (s:Subdomain {id: $id})
        SET s.name = $name,
            s.domainId = $domainId
        `,
        {
          id: subdomain.id,
          name: subdomain.name,
          domainId: subdomain.domainId,
        }
      );

      // Create relationships to domain
      await session.run(
        `
        MATCH (s:Subdomain {id: $subdomainId})
        MATCH (d:Domain {id: $domainId})
        MERGE (d)-[:HAS_SUBDOMAIN]->(s)
        MERGE (s)-[:BELONGS_TO_DOMAIN]->(d)
        `,
        {
          subdomainId: subdomain.id,
          domainId: subdomain.domainId,
        }
      );
    } catch (error) {
      console.error(`Error syncing subdomain ${subdomain.id}:`, error);
    } finally {
      if (session) await session.close();
    }
  }

  /**
   * Sync all MCPs
   */
  private static async syncAllMCPs(): Promise<void> {
    const mcps = await db.query.mcps.findMany({
      with: { subdomain: true },
    });
    for (const mcp of mcps) {
      await this.syncMCP(mcp);
    }
    console.log(`✓ Synced ${mcps.length} MCPs`);
  }

  /**
   * Sync single MCP
   */
  static async syncMCP(mcp: any): Promise<void> {
    let session: Session | null = null;
    try {
      session = await getNeo4jSession();

      // Create MCP node
      await session.run(
        `
        MERGE (m:MCP {id: $id})
        SET m.name = $name,
            m.status = $status,
            m.targetQuarter = $targetQuarter,
            m.priority = $priority,
            m.subdomainId = $subdomainId
        `,
        {
          id: mcp.id,
          name: mcp.name,
          status: mcp.status,
          targetQuarter: mcp.targetQuarter || '',
          priority: mcp.priority || 3,
          subdomainId: mcp.subdomainId,
        }
      );

      // Create relationships
      await session.run(
        `
        MATCH (m:MCP {id: $mcpId})
        MATCH (s:Subdomain {id: $subdomainId})
        MERGE (s)-[:HAS_MCP]->(m)
        MERGE (m)-[:BELONGS_TO_SUBDOMAIN]->(s)
        `,
        {
          mcpId: mcp.id,
          subdomainId: mcp.subdomainId,
        }
      );
    } catch (error) {
      console.error(`Error syncing MCP ${mcp.id}:`, error);
    } finally {
      if (session) await session.close();
    }
  }

  /**
   * Sync all tools
   */
  private static async syncAllTools(): Promise<void> {
    const tools = await db.query.tools.findMany({
      with: { mcp: true },
    });
    for (const tool of tools) {
      await this.syncTool(tool);
    }
    console.log(`✓ Synced ${tools.length} tools`);
  }

  /**
   * Sync single tool
   */
  static async syncTool(tool: any): Promise<void> {
    let session: Session | null = null;
    try {
      session = await getNeo4jSession();

      // Create tool node
      await session.run(
        `
        MERGE (t:Tool {id: $id})
        SET t.name = $name,
            t.status = $status,
            t.mcpId = $mcpId
        `,
        {
          id: tool.id,
          name: tool.name,
          status: tool.status,
          mcpId: tool.mcpId,
        }
      );

      // Create relationships
      await session.run(
        `
        MATCH (t:Tool {id: $toolId})
        MATCH (m:MCP {id: $mcpId})
        MERGE (m)-[:HAS_TOOL]->(t)
        MERGE (t)-[:BELONGS_TO_MCP]->(m)
        `,
        {
          toolId: tool.id,
          mcpId: tool.mcpId,
        }
      );
    } catch (error) {
      console.error(`Error syncing tool ${tool.id}:`, error);
    } finally {
      if (session) await session.close();
    }
  }

  /**
   * Sync all agent categories
   */
  private static async syncAllAgentCategories(): Promise<void> {
    const categories = await db.query.agentCategories.findMany();
    for (const category of categories) {
      await this.syncAgentCategory(category);
    }
    console.log(`✓ Synced ${categories.length} agent categories`);
  }

  /**
   * Sync single agent category
   */
  private static async syncAgentCategory(category: any): Promise<void> {
    let session: Session | null = null;
    try {
      session = await getNeo4jSession();
      await session.run(
        `
        MERGE (c:AgentCategory {code: $code})
        SET c.name = $name,
            c.icon = $icon,
            c.color = $color
        `,
        {
          code: category.code,
          name: category.name,
          icon: category.icon || '',
          color: category.color || '#8B5CF6',
        }
      );
    } catch (error) {
      console.error(`Error syncing agent category ${category.code}:`, error);
    } finally {
      if (session) await session.close();
    }
  }

  /**
   * Sync all agents
   */
  private static async syncAllAgents(): Promise<void> {
    const agents = await db.query.agents.findMany({
      with: { category: true },
    });
    for (const agent of agents) {
      await this.syncAgent(agent);
    }
    console.log(`✓ Synced ${agents.length} agents`);
  }

  /**
   * Sync single agent
   */
  static async syncAgent(agent: any): Promise<void> {
    let session: Session | null = null;
    try {
      session = await getNeo4jSession();

      // Create agent node
      await session.run(
        `
        MERGE (a:Agent {id: $id})
        SET a.code = $code,
            a.name = $name,
            a.autonomyLevel = $autonomyLevel,
            a.active = $active,
            a.activeInstances = $activeInstances,
            a.categoryCode = $categoryCode
        `,
        {
          id: agent.id,
          code: agent.code,
          name: agent.name,
          autonomyLevel: agent.autonomyLevel || 1,
          active: agent.active,
          activeInstances: agent.activeInstances || 0,
          categoryCode: agent.categoryCode,
        }
      );

      // Link to category
      await session.run(
        `
        MATCH (a:Agent {id: $agentId})
        MATCH (c:AgentCategory {code: $categoryCode})
        MERGE (a)-[:BELONGS_TO_CATEGORY]->(c)
        `,
        {
          agentId: agent.id,
          categoryCode: agent.categoryCode,
        }
      );

      // Link to primary MCP if exists
      if (agent.mcpId) {
        await session.run(
          `
          MATCH (a:Agent {id: $agentId})
          MATCH (m:MCP {id: $mcpId})
          MERGE (a)-[:USES_MCP {role: 'primary'}]->(m)
          `,
          {
            agentId: agent.id,
            mcpId: agent.mcpId,
          }
        );
      }
    } catch (error) {
      console.error(`Error syncing agent ${agent.id}:`, error);
    } finally {
      if (session) await session.close();
    }
  }

  /**
   * Sync all workflows
   */
  private static async syncAllWorkflows(): Promise<void> {
    const workflows = await db.query.workflows.findMany({
      with: { subdomain: true },
    });
    for (const workflow of workflows) {
      await this.syncWorkflow(workflow);
    }
    console.log(`✓ Synced ${workflows.length} workflows`);
  }

  /**
   * Sync single workflow
   */
  static async syncWorkflow(workflow: any): Promise<void> {
    let session: Session | null = null;
    try {
      session = await getNeo4jSession();

      // Create workflow node
      await session.run(
        `
        MERGE (w:Workflow {id: $id})
        SET w.name = $name,
            w.status = $status,
            w.complexity = $complexity,
            w.wave = $wave,
            w.subdomainId = $subdomainId
        `,
        {
          id: workflow.id,
          name: workflow.name,
          status: workflow.status,
          complexity: workflow.complexity || 3,
          wave: workflow.implementationWave || 1,
          subdomainId: workflow.subdomainId,
        }
      );

      // Link to subdomain
      await session.run(
        `
        MATCH (w:Workflow {id: $workflowId})
        MATCH (s:Subdomain {id: $subdomainId})
        MERGE (w)-[:BELONGS_TO_SUBDOMAIN]->(s)
        `,
        {
          workflowId: workflow.id,
          subdomainId: workflow.subdomainId,
        }
      );
    } catch (error) {
      console.error(`Error syncing workflow ${workflow.id}:`, error);
    } finally {
      if (session) await session.close();
    }
  }

  /**
   * Sync all MCP dependencies
   */
  private static async syncAllMCPDependencies(): Promise<void> {
    const dependencies = await db.query.mcpDependencies.findMany();
    for (const dep of dependencies) {
      await this.syncMCPDependency(dep);
    }
    console.log(`✓ Synced ${dependencies.length} MCP dependencies`);
  }

  /**
   * Sync MCP dependency relationship
   */
  static async syncMCPDependency(dep: any): Promise<void> {
    let session: Session | null = null;
    try {
      session = await getNeo4jSession();
      await session.run(
        `
        MATCH (source:MCP {id: $sourceId})
        MATCH (target:MCP {id: $targetId})
        MERGE (source)-[r:DEPENDS_ON]->(target)
        SET r.type = $type,
            r.isCritical = $isCritical
        `,
        {
          sourceId: dep.sourceMcpId,
          targetId: dep.targetMcpId,
          type: dep.dependencyType,
          isCritical: dep.isCritical || false,
        }
      );
    } catch (error) {
      console.error(`Error syncing MCP dependency:`, error);
    } finally {
      if (session) await session.close();
    }
  }

  /**
   * Sync all cross-domain bridges
   */
  private static async syncAllCrossDomainBridges(): Promise<void> {
    const bridges = await db.query.crossDomainBridges.findMany();
    for (const bridge of bridges) {
      await this.syncCrossDomainBridge(bridge);
    }
    console.log(`✓ Synced ${bridges.length} cross-domain bridges`);
  }

  /**
   * Sync cross-domain bridge relationship
   */
  static async syncCrossDomainBridge(bridge: any): Promise<void> {
    let session: Session | null = null;
    try {
      session = await getNeo4jSession();
      await session.run(
        `
        MATCH (source:Subdomain {id: $sourceId})
        MATCH (target:Subdomain {id: $targetId})
        MERGE (source)-[r:BRIDGES_TO]->(target)
        SET r.type = $type,
            r.name = $name,
            r.strength = $strength,
            r.isCritical = $isCritical
        `,
        {
          sourceId: bridge.sourceSubdomainId,
          targetId: bridge.targetSubdomainId,
          type: bridge.bridgeType,
          name: bridge.name,
          strength: bridge.strength || 3,
          isCritical: bridge.isCritical || false,
        }
      );
    } catch (error) {
      console.error(`Error syncing cross-domain bridge:`, error);
    } finally {
      if (session) await session.close();
    }
  }

  /**
   * Sync all agent collaborations
   */
  private static async syncAllAgentCollaborations(): Promise<void> {
    const collaborations = await db.query.agentCollaborations.findMany();
    for (const collab of collaborations) {
      await this.syncAgentCollaboration(collab);
    }
    console.log(`✓ Synced ${collaborations.length} agent collaborations`);
  }

  /**
   * Sync agent collaboration relationship
   */
  static async syncAgentCollaboration(collab: any): Promise<void> {
    let session: Session | null = null;
    try {
      session = await getNeo4jSession();
      await session.run(
        `
        MATCH (source:Agent {id: $sourceId})
        MATCH (target:Agent {id: $targetId})
        MERGE (source)-[r:COLLABORATES_WITH]->(target)
        SET r.type = $type,
            r.strength = $strength,
            r.bidirectional = $bidirectional
        `,
        {
          sourceId: collab.sourceAgentId,
          targetId: collab.targetAgentId,
          type: collab.collaborationType,
          strength: collab.strength || 3,
          bidirectional: collab.bidirectional || false,
        }
      );
    } catch (error) {
      console.error(`Error syncing agent collaboration:`, error);
    } finally {
      if (session) await session.close();
    }
  }

  /**
   * Sync all workflow-MCP relationships
   */
  private static async syncAllWorkflowMCPs(): Promise<void> {
    const workflowMcps = await db.query.workflowMcps.findMany();
    for (const wm of workflowMcps) {
      await this.syncWorkflowMCP(wm);
    }
    console.log(`✓ Synced ${workflowMcps.length} workflow-MCP relationships`);
  }

  /**
   * Sync workflow-MCP relationship
   */
  static async syncWorkflowMCP(wm: any): Promise<void> {
    let session: Session | null = null;
    try {
      session = await getNeo4jSession();
      await session.run(
        `
        MATCH (w:Workflow {id: $workflowId})
        MATCH (m:MCP {id: $mcpId})
        MERGE (w)-[r:POWERED_BY]->(m)
        SET r.role = $role
        `,
        {
          workflowId: wm.workflowId,
          mcpId: wm.mcpId,
          role: wm.role || 'supporting',
        }
      );
    } catch (error) {
      console.error(`Error syncing workflow-MCP:`, error);
    } finally {
      if (session) await session.close();
    }
  }

  /**
   * Sync all workflow-agent relationships
   */
  private static async syncAllWorkflowAgents(): Promise<void> {
    const workflowAgents = await db.query.workflowAgents.findMany();
    for (const wa of workflowAgents) {
      await this.syncWorkflowAgent(wa);
    }
    console.log(`✓ Synced ${workflowAgents.length} workflow-agent relationships`);
  }

  /**
   * Sync workflow-agent relationship
   */
  static async syncWorkflowAgent(wa: any): Promise<void> {
    let session: Session | null = null;
    try {
      session = await getNeo4jSession();
      await session.run(
        `
        MATCH (w:Workflow {id: $workflowId})
        MATCH (a:Agent {id: $agentId})
        MERGE (w)-[r:EXECUTED_BY]->(a)
        SET r.role = $role
        `,
        {
          workflowId: wa.workflowId,
          agentId: wa.agentId,
          role: wa.role || 'executor',
        }
      );
    } catch (error) {
      console.error(`Error syncing workflow-agent:`, error);
    } finally {
      if (session) await session.close();
    }
  }

  /**
   * Delete a node from Neo4j
   */
  static async deleteNode(type: string, id: string): Promise<void> {
    let session: Session | null = null;
    try {
      session = await getNeo4jSession();
      await session.run(
        `
        MATCH (n:${type} {id: $id})
        DETACH DELETE n
        `,
        { id }
      );
      console.log(`✓ Deleted ${type} node ${id} from Neo4j`);
    } catch (error) {
      console.error(`Error deleting ${type} node:`, error);
    } finally {
      if (session) await session.close();
    }
  }

  /**
   * Delete a relationship from Neo4j
   */
  static async deleteRelationship(
    relType: string,
    sourceId: string,
    targetId: string
  ): Promise<void> {
    let session: Session | null = null;
    try {
      session = await getNeo4jSession();
      await session.run(
        `
        MATCH (s {id: $sourceId})-[r:${relType}]->(t {id: $targetId})
        DELETE r
        `,
        { sourceId, targetId }
      );
      console.log(`✓ Deleted ${relType} relationship from Neo4j`);
    } catch (error) {
      console.error(`Error deleting ${relType} relationship:`, error);
    } finally {
      if (session) await session.close();
    }
  }

  /**
   * Verify sync integrity between PostgreSQL and Neo4j
   */
  static async verifySyncIntegrity(): Promise<IntegrityReport> {
    const report: IntegrityReport = {
      postgresCount: {},
      neo4jCount: {},
      mismatches: [],
      orphanedNodes: 0,
    };

    try {
      // Count PostgreSQL entities
      report.postgresCount = {
        domains: (await db.query.domains.findMany()).length,
        subdomains: (await db.query.subdomains.findMany()).length,
        mcps: (await db.query.mcps.findMany()).length,
        tools: (await db.query.tools.findMany()).length,
        agents: (await db.query.agents.findMany()).length,
        workflows: (await db.query.workflows.findMany()).length,
      };

      // Count Neo4j entities
      const session = await getNeo4jSession();
      const neo4jCounts = await session.run(`
        MATCH (n)
        RETURN labels(n)[0] as label, count(*) as count
      `);

      neo4jCounts.records.forEach((record) => {
        const label = record.get('label');
        const count = record.get('count').toNumber();
        report.neo4jCount[label] = count;
      });

      await session.close();

      // Find mismatches
      for (const [type, pgCount] of Object.entries(report.postgresCount)) {
        const neo4jCount = report.neo4jCount[type] || 0;
        if (pgCount !== neo4jCount) {
          report.mismatches.push(
            `${type}: PostgreSQL=${pgCount}, Neo4j=${neo4jCount}`
          );
        }
      }

      console.log('✓ Sync integrity check complete');
      return report;
    } catch (error) {
      console.error('Error verifying sync integrity:', error);
      throw error;
    }
  }
}

// CLI execution
if (require.main === module) {
  console.log('Starting Neo4j full sync...');
  Neo4jSyncService.fullSync()
    .then((result) => {
      console.log('Sync result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Sync failed:', error);
      process.exit(1);
    });
}
