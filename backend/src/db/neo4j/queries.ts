import { getNeo4jSession } from './connection';
import { Session } from 'neo4j-driver';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface EntityRef {
  id: string;
  type: string;
  name: string;
}

export interface DependencyChain {
  rootEntity: EntityRef;
  dependents: {
    entity: EntityRef;
    relationship: string;
    depth: number;
    isCritical: boolean;
  }[];
  totalCount: number;
  criticalCount: number;
}

export interface ImpactAnalysis {
  canProceed: boolean;
  hardBlocks: {
    reason: string;
    entities: EntityRef[];
    explanation: string;
  }[];
  softBlocks: {
    reason: string;
    entities: EntityRef[];
    explanation: string;
  }[];
  safeToRemove: EntityRef[];
  estimatedEffort: string;
}

export interface GraphNode {
  id: string;
  type: string;
  name: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  properties: Record<string, any>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Path {
  nodes: EntityRef[];
  relationships: string[];
  length: number;
  totalStrength: number;
}

export interface ConnectionMatrix {
  domains: string[];
  matrix: number[][];
}

export interface CriticalPathResult {
  criticalMCPs: Array<{
    mcp: EntityRef;
    incomingCount: number;
    outgoingCount: number;
    criticalityScore: number;
  }>;
  mostConnectedSubdomains: Array<{
    subdomain: EntityRef;
    connectionCount: number;
  }>;
}

export interface NetworkData {
  agents: EntityRef[];
  collaborations: Array<{
    source: string;
    target: string;
    type: string;
    strength: number;
  }>;
}

// ============================================
// DEPENDENCY ANALYSIS
// ============================================

/**
 * Get all entities that depend on this entity (downstream)
 */
export async function getDownstreamDependents(
  entityType: string,
  entityId: string
): Promise<DependencyChain> {
  let session: Session | null = null;
  try {
    session = await getNeo4jSession();

    const result = await session.run(
      `
      MATCH (root:${entityType} {id: $entityId})
      OPTIONAL MATCH path = (root)<-[r*1..5]-(dependent)
      WITH root, dependent, r, length(path) as depth
      WHERE dependent IS NOT NULL
      RETURN
        root.id as rootId,
        root.name as rootName,
        labels(dependent)[0] as depType,
        dependent.id as depId,
        dependent.name as depName,
        type(last(r)) as relType,
        depth,
        any(rel in r WHERE rel.isCritical = true) as isCritical
      ORDER BY depth, depType
      `,
      { entityId }
    );

    const rootEntity: EntityRef = {
      id: entityId,
      type: entityType,
      name: result.records[0]?.get('rootName') || 'Unknown',
    };

    const dependents = result.records.map((record) => ({
      entity: {
        id: record.get('depId'),
        type: record.get('depType'),
        name: record.get('depName'),
      },
      relationship: record.get('relType'),
      depth: record.get('depth').toNumber(),
      isCritical: record.get('isCritical') || false,
    }));

    const criticalCount = dependents.filter((d) => d.isCritical).length;

    return {
      rootEntity,
      dependents,
      totalCount: dependents.length,
      criticalCount,
    };
  } catch (error) {
    console.error('Error getting downstream dependents:', error);
    throw error;
  } finally {
    if (session) await session.close();
  }
}

/**
 * Get all entities this entity depends on (upstream)
 */
export async function getUpstreamDependencies(
  entityType: string,
  entityId: string
): Promise<DependencyChain> {
  let session: Session | null = null;
  try {
    session = await getNeo4jSession();

    const result = await session.run(
      `
      MATCH (root:${entityType} {id: $entityId})
      OPTIONAL MATCH path = (root)-[r*1..5]->(dependency)
      WITH root, dependency, r, length(path) as depth
      WHERE dependency IS NOT NULL
      RETURN
        root.id as rootId,
        root.name as rootName,
        labels(dependency)[0] as depType,
        dependency.id as depId,
        dependency.name as depName,
        type(last(r)) as relType,
        depth,
        any(rel in r WHERE rel.isCritical = true) as isCritical
      ORDER BY depth, depType
      `,
      { entityId }
    );

    const rootEntity: EntityRef = {
      id: entityId,
      type: entityType,
      name: result.records[0]?.get('rootName') || 'Unknown',
    };

    const dependents = result.records.map((record) => ({
      entity: {
        id: record.get('depId'),
        type: record.get('depType'),
        name: record.get('depName'),
      },
      relationship: record.get('relType'),
      depth: record.get('depth').toNumber(),
      isCritical: record.get('isCritical') || false,
    }));

    const criticalCount = dependents.filter((d) => d.isCritical).length;

    return {
      rootEntity,
      dependents,
      totalCount: dependents.length,
      criticalCount,
    };
  } catch (error) {
    console.error('Error getting upstream dependencies:', error);
    throw error;
  } finally {
    if (session) await session.close();
  }
}

/**
 * Get full dependency subgraph centered on an entity
 */
export async function getDependencyGraph(
  entityType: string,
  entityId: string,
  depth: number = 3
): Promise<GraphData> {
  let session: Session | null = null;
  try {
    session = await getNeo4jSession();

    const result = await session.run(
      `
      MATCH (center:${entityType} {id: $entityId})
      OPTIONAL MATCH path = (center)-[*1..${depth}]-(connected)
      WITH center, connected, relationships(path) as rels
      WHERE connected IS NOT NULL
      RETURN
        collect(DISTINCT {
          id: center.id,
          type: labels(center)[0],
          name: center.name,
          properties: properties(center)
        }) + collect(DISTINCT {
          id: connected.id,
          type: labels(connected)[0],
          name: connected.name,
          properties: properties(connected)
        }) as nodes,
        collect(DISTINCT {
          source: startNode(rels[0]).id,
          target: endNode(rels[0]).id,
          type: type(rels[0]),
          properties: properties(rels[0])
        }) as edges
      `,
      { entityId }
    );

    if (result.records.length === 0) {
      return { nodes: [], edges: [] };
    }

    const record = result.records[0];
    return {
      nodes: record.get('nodes') as GraphNode[],
      edges: record.get('edges') as GraphEdge[],
    };
  } catch (error) {
    console.error('Error getting dependency graph:', error);
    throw error;
  } finally {
    if (session) await session.close();
  }
}

// ============================================
// IMPACT ANALYSIS
// ============================================

/**
 * Analyze impact of deleting an entity
 */
export async function analyzeDeleteImpact(
  entityType: string,
  entityId: string
): Promise<ImpactAnalysis> {
  const downstream = await getDownstreamDependents(entityType, entityId);

  const analysis: ImpactAnalysis = {
    canProceed: true,
    hardBlocks: [],
    softBlocks: [],
    safeToRemove: [],
    estimatedEffort: 'low',
  };

  // Hard blocks: critical dependencies
  const criticalDeps = downstream.dependents.filter((d) => d.isCritical);
  if (criticalDeps.length > 0) {
    analysis.canProceed = false;
    analysis.hardBlocks.push({
      reason: 'Critical dependencies exist',
      entities: criticalDeps.map((d) => d.entity),
      explanation: `${criticalDeps.length} critical dependencies must be resolved first`,
    });
  }

  // Soft blocks: non-critical dependencies
  const nonCriticalDeps = downstream.dependents.filter((d) => !d.isCritical);
  if (nonCriticalDeps.length > 0) {
    analysis.softBlocks.push({
      reason: 'Non-critical dependencies',
      entities: nonCriticalDeps.map((d) => d.entity),
      explanation: `${nonCriticalDeps.length} entities reference this. Consider updating them.`,
    });
  }

  // Determine effort
  if (downstream.totalCount === 0) {
    analysis.estimatedEffort = 'low';
    analysis.safeToRemove = [downstream.rootEntity];
  } else if (downstream.totalCount < 5) {
    analysis.estimatedEffort = 'medium';
  } else {
    analysis.estimatedEffort = 'high';
  }

  return analysis;
}

/**
 * Analyze impact of editing an entity
 */
export async function analyzeEditImpact(
  entityType: string,
  entityId: string,
  proposedChanges: object
): Promise<ImpactAnalysis> {
  // For now, return a basic analysis
  // In future, could analyze specific field changes
  const downstream = await getDownstreamDependents(entityType, entityId);

  return {
    canProceed: true,
    hardBlocks: [],
    softBlocks:
      downstream.totalCount > 0
        ? [
            {
              reason: 'Entities depend on this',
              entities: downstream.dependents.map((d) => d.entity),
              explanation: `${downstream.totalCount} entities may be affected by changes`,
            },
          ]
        : [],
    safeToRemove: [],
    estimatedEffort: downstream.totalCount > 10 ? 'high' : 'low',
  };
}

// ============================================
// CROSS-DOMAIN ANALYSIS
// ============================================

/**
 * Find all paths connecting two domains
 */
export async function getCrossDomainPaths(
  sourceDomainId: string,
  targetDomainId: string
): Promise<Path[]> {
  let session: Session | null = null;
  try {
    session = await getNeo4jSession();

    const result = await session.run(
      `
      MATCH (source:Domain {id: $sourceDomainId})
      MATCH (target:Domain {id: $targetDomainId})
      MATCH path = (source)-[*..10]-(target)
      WITH path,
           [n in nodes(path) | {id: n.id, type: labels(n)[0], name: n.name}] as nodeRefs,
           [r in relationships(path) | type(r)] as relTypes,
           reduce(s = 0, r in relationships(path) | s + coalesce(r.strength, 1)) as totalStrength
      RETURN nodeRefs, relTypes, length(path) as pathLength, totalStrength
      ORDER BY pathLength, totalStrength DESC
      LIMIT 10
      `,
      { sourceDomainId, targetDomainId }
    );

    return result.records.map((record) => ({
      nodes: record.get('nodeRefs'),
      relationships: record.get('relTypes'),
      length: record.get('pathLength').toNumber(),
      totalStrength: record.get('totalStrength').toNumber(),
    }));
  } catch (error) {
    console.error('Error getting cross-domain paths:', error);
    throw error;
  } finally {
    if (session) await session.close();
  }
}

/**
 * Get domain connection matrix
 */
export async function getDomainConnectionMatrix(): Promise<ConnectionMatrix> {
  let session: Session | null = null;
  try {
    session = await getNeo4jSession();

    const domains = await session.run(`
      MATCH (d:Domain)
      RETURN d.id as id, d.name as name
      ORDER BY d.name
    `);

    const domainList = domains.records.map((r) => ({
      id: r.get('id'),
      name: r.get('name'),
    }));

    const matrix: number[][] = Array(domainList.length)
      .fill(0)
      .map(() => Array(domainList.length).fill(0));

    // Count connections between domains via subdomains
    const connections = await session.run(`
      MATCH (d1:Domain)-[:HAS_SUBDOMAIN]->(s1:Subdomain)
      MATCH (s1)-[:BRIDGES_TO]->(s2:Subdomain)
      MATCH (d2:Domain)-[:HAS_SUBDOMAIN]->(s2)
      RETURN d1.id as source, d2.id as target, count(*) as bridgeCount
    `);

    connections.records.forEach((record) => {
      const sourceId = record.get('source');
      const targetId = record.get('target');
      const count = record.get('bridgeCount').toNumber();

      const sourceIdx = domainList.findIndex((d) => d.id === sourceId);
      const targetIdx = domainList.findIndex((d) => d.id === targetId);

      if (sourceIdx >= 0 && targetIdx >= 0) {
        matrix[sourceIdx][targetIdx] = count;
      }
    });

    return {
      domains: domainList.map((d) => d.name),
      matrix,
    };
  } catch (error) {
    console.error('Error getting domain connection matrix:', error);
    throw error;
  } finally {
    if (session) await session.close();
  }
}

/**
 * Get critical path - most connected MCPs
 */
export async function getCriticalPath(): Promise<CriticalPathResult> {
  let session: Session | null = null;
  try {
    session = await getNeo4jSession();

    const mcps = await session.run(`
      MATCH (m:MCP)
      OPTIONAL MATCH (m)<-[incoming:DEPENDS_ON]-()
      OPTIONAL MATCH (m)-[outgoing:DEPENDS_ON]->()
      WITH m, count(DISTINCT incoming) as inCount, count(DISTINCT outgoing) as outCount
      WITH m, inCount, outCount, (inCount * 2 + outCount) as score
      WHERE score > 0
      RETURN m.id as id, m.name as name, inCount, outCount, score
      ORDER BY score DESC
      LIMIT 10
    `);

    const criticalMCPs = mcps.records.map((r) => ({
      mcp: {
        id: r.get('id'),
        type: 'MCP',
        name: r.get('name'),
      },
      incomingCount: r.get('inCount').toNumber(),
      outgoingCount: r.get('outCount').toNumber(),
      criticalityScore: r.get('score').toNumber(),
    }));

    const subdomains = await session.run(`
      MATCH (s:Subdomain)
      OPTIONAL MATCH (s)-[r:BRIDGES_TO|HAS_MCP]-()
      WITH s, count(r) as connections
      WHERE connections > 0
      RETURN s.id as id, s.name as name, connections
      ORDER BY connections DESC
      LIMIT 10
    `);

    const mostConnectedSubdomains = subdomains.records.map((r) => ({
      subdomain: {
        id: r.get('id'),
        type: 'Subdomain',
        name: r.get('name'),
      },
      connectionCount: r.get('connections').toNumber(),
    }));

    return {
      criticalMCPs,
      mostConnectedSubdomains,
    };
  } catch (error) {
    console.error('Error getting critical path:', error);
    throw error;
  } finally {
    if (session) await session.close();
  }
}

// ============================================
// AGENT NETWORK
// ============================================

/**
 * Get full agent collaboration network
 */
export async function getAgentNetwork(): Promise<NetworkData> {
  let session: Session | null = null;
  try {
    session = await getNeo4jSession();

    const result = await session.run(`
      MATCH (a:Agent)
      OPTIONAL MATCH (a)-[c:COLLABORATES_WITH]->(other:Agent)
      RETURN
        collect(DISTINCT {id: a.id, type: 'Agent', name: a.name}) as agents,
        collect({
          source: a.id,
          target: other.id,
          type: c.type,
          strength: c.strength
        }) as collaborations
    `);

    if (result.records.length === 0) {
      return { agents: [], collaborations: [] };
    }

    const record = result.records[0];
    return {
      agents: record.get('agents'),
      collaborations: record.get('collaborations').filter((c: any) => c.target !== null),
    };
  } catch (error) {
    console.error('Error getting agent network:', error);
    throw error;
  } finally {
    if (session) await session.close();
  }
}

/**
 * Get all agents reachable from a given agent
 */
export async function getAgentReachability(agentId: string): Promise<EntityRef[]> {
  let session: Session | null = null;
  try {
    session = await getNeo4jSession();

    const result = await session.run(
      `
      MATCH (source:Agent {id: $agentId})
      MATCH path = (source)-[:COLLABORATES_WITH*1..5]->(reachable:Agent)
      RETURN DISTINCT reachable.id as id, reachable.name as name
      `,
      { agentId }
    );

    return result.records.map((r) => ({
      id: r.get('id'),
      type: 'Agent',
      name: r.get('name'),
    }));
  } catch (error) {
    console.error('Error getting agent reachability:', error);
    throw error;
  } finally {
    if (session) await session.close();
  }
}

// ============================================
// PATH FINDING
// ============================================

/**
 * Find shortest path between two entities
 */
export async function findShortestPath(
  sourceType: string,
  sourceId: string,
  targetType: string,
  targetId: string
): Promise<Path | null> {
  let session: Session | null = null;
  try {
    session = await getNeo4jSession();

    const result = await session.run(
      `
      MATCH (source:${sourceType} {id: $sourceId})
      MATCH (target:${targetType} {id: $targetId})
      MATCH path = shortestPath((source)-[*..10]-(target))
      RETURN
        [n in nodes(path) | {id: n.id, type: labels(n)[0], name: n.name}] as nodes,
        [r in relationships(path) | type(r)] as relationships,
        length(path) as pathLength,
        reduce(s = 0, r in relationships(path) | s + coalesce(r.strength, 1)) as totalStrength
      `,
      { sourceId, targetId }
    );

    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];
    return {
      nodes: record.get('nodes'),
      relationships: record.get('relationships'),
      length: record.get('pathLength').toNumber(),
      totalStrength: record.get('totalStrength').toNumber(),
    };
  } catch (error) {
    console.error('Error finding shortest path:', error);
    throw error;
  } finally {
    if (session) await session.close();
  }
}

/**
 * Find all paths between two entities (up to max depth)
 */
export async function findAllPaths(
  sourceType: string,
  sourceId: string,
  targetType: string,
  targetId: string,
  maxDepth: number = 5
): Promise<Path[]> {
  let session: Session | null = null;
  try {
    session = await getNeo4jSession();

    const result = await session.run(
      `
      MATCH (source:${sourceType} {id: $sourceId})
      MATCH (target:${targetType} {id: $targetId})
      MATCH path = (source)-[*1..${maxDepth}]-(target)
      RETURN
        [n in nodes(path) | {id: n.id, type: labels(n)[0], name: n.name}] as nodes,
        [r in relationships(path) | type(r)] as relationships,
        length(path) as pathLength,
        reduce(s = 0, r in relationships(path) | s + coalesce(r.strength, 1)) as totalStrength
      ORDER BY pathLength, totalStrength DESC
      LIMIT 20
      `,
      { sourceId, targetId }
    );

    return result.records.map((record) => ({
      nodes: record.get('nodes'),
      relationships: record.get('relationships'),
      length: record.get('pathLength').toNumber(),
      totalStrength: record.get('totalStrength').toNumber(),
    }));
  } catch (error) {
    console.error('Error finding all paths:', error);
    throw error;
  } finally {
    if (session) await session.close();
  }
}
