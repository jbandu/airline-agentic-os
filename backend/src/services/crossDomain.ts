import { db } from '../db';
import { subdomains, mcps, crossDomainBridges, mcpDependencies } from '../db/schema';
import { eq, inArray, sql } from 'drizzle-orm';

interface ImpactAnalysis {
  affectedDomains: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    bridgeCount: number;
  }>;
  bridges: Array<any>;
  mcpDependencies: Array<any>;
  totalImpact: number;
}

interface DataFlowPath {
  path: Array<{ id: string; name: string; type: string }>;
  bridges: Array<any>;
  distance: number;
}

interface CriticalMCP {
  id: string;
  name: string;
  incomingConnections: number;
  outgoingConnections: number;
  criticalityScore: number;
  domain: string;
}

export class CrossDomainService {
  /**
   * Analyze the cross-domain impact of changes to a subdomain
   */
  static async analyzeCrossDomainImpact(subdomainId: string): Promise<ImpactAnalysis> {
    // Get all bridges involving this subdomain
    const outgoingBridges = await db.query.crossDomainBridges.findMany({
      where: eq(crossDomainBridges.sourceSubdomainId, subdomainId),
      with: {
        targetSubdomain: {
          with: {
            domain: true,
          },
        },
      },
    });

    const incomingBridges = await db.query.crossDomainBridges.findMany({
      where: eq(crossDomainBridges.targetSubdomainId, subdomainId),
      with: {
        sourceSubdomain: {
          with: {
            domain: true,
          },
        },
      },
    });

    // Get MCPs in this subdomain
    const subdomainMcps = await db.query.mcps.findMany({
      where: eq(mcps.subdomainId, subdomainId),
    });

    const mcpIds = subdomainMcps.map((m) => m.id);

    // Get MCP dependencies
    let dependencies: any[] = [];
    if (mcpIds.length > 0) {
      const sourceDeps = await db.query.mcpDependencies.findMany({
        where: inArray(mcpDependencies.sourceMcpId, mcpIds),
        with: {
          targetMcp: {
            with: {
              subdomain: {
                with: {
                  domain: true,
                },
              },
            },
          },
        },
      });

      const targetDeps = await db.query.mcpDependencies.findMany({
        where: inArray(mcpDependencies.targetMcpId, mcpIds),
        with: {
          sourceMcp: {
            with: {
              subdomain: {
                with: {
                  domain: true,
                },
              },
            },
          },
        },
      });

      dependencies = [...sourceDeps, ...targetDeps];
    }

    // Aggregate affected domains
    const domainMap = new Map<string, any>();

    // Process outgoing bridges
    outgoingBridges.forEach((bridge) => {
      const domain = bridge.targetSubdomain?.domain;
      if (domain) {
        if (!domainMap.has(domain.id)) {
          domainMap.set(domain.id, {
            id: domain.id,
            name: domain.name,
            icon: domain.icon,
            color: domain.color,
            bridgeCount: 0,
          });
        }
        domainMap.get(domain.id).bridgeCount++;
      }
    });

    // Process incoming bridges
    incomingBridges.forEach((bridge) => {
      const domain = bridge.sourceSubdomain?.domain;
      if (domain) {
        if (!domainMap.has(domain.id)) {
          domainMap.set(domain.id, {
            id: domain.id,
            name: domain.name,
            icon: domain.icon,
            color: domain.color,
            bridgeCount: 0,
          });
        }
        domainMap.get(domain.id).bridgeCount++;
      }
    });

    dependencies.forEach((dep) => {
      const domain =
        dep.targetMcp?.subdomain?.domain || dep.sourceMcp?.subdomain?.domain;
      if (domain && !domainMap.has(domain.id)) {
        domainMap.set(domain.id, {
          id: domain.id,
          name: domain.name,
          icon: domain.icon,
          color: domain.color,
          bridgeCount: 0,
        });
      }
    });

    return {
      affectedDomains: Array.from(domainMap.values()),
      bridges: [...outgoingBridges, ...incomingBridges],
      mcpDependencies: dependencies,
      totalImpact: domainMap.size,
    };
  }

  /**
   * Find data flow path between two nodes (BFS algorithm)
   */
  static async getDataFlowPath(
    sourceId: string,
    targetId: string
  ): Promise<DataFlowPath | null> {
    // Get all bridges and dependencies
    const allBridges = await db.query.crossDomainBridges.findMany({
      with: {
        sourceSubdomain: true,
        targetSubdomain: true,
      },
    });

    const allDependencies = await db.query.mcpDependencies.findMany({
      with: {
        sourceMcp: {
          with: {
            subdomain: true,
          },
        },
        targetMcp: {
          with: {
            subdomain: true,
          },
        },
      },
    });

    // Build adjacency list
    const graph = new Map<string, Array<{ id: string; bridge: any }>>();

    allBridges.forEach((bridge) => {
      const src = bridge.sourceSubdomainId;
      const tgt = bridge.targetSubdomainId;

      if (!graph.has(src)) graph.set(src, []);
      if (!graph.has(tgt)) graph.set(tgt, []);

      // Add bidirectional edges for bridges
      graph.get(src)!.push({ id: tgt, bridge });
      graph.get(tgt)!.push({ id: src, bridge });
    });

    allDependencies.forEach((dep) => {
      const src = dep.sourceMcp.subdomainId;
      const tgt = dep.targetMcp.subdomainId;

      if (!graph.has(src)) graph.set(src, []);
      if (!graph.has(tgt)) graph.set(tgt, []);

      graph.get(src)!.push({ id: tgt, bridge: dep });
    });

    // BFS to find shortest path
    const queue: Array<{ id: string; path: string[]; bridges: any[] }> = [
      { id: sourceId, path: [sourceId], bridges: [] },
    ];
    const visited = new Set<string>([sourceId]);

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.id === targetId) {
        // Found path - build result
        const pathNodes = await Promise.all(
          current.path.map(async (id) => {
            const subdomain = await db.query.subdomains.findFirst({
              where: eq(subdomains.id, id),
            });
            return {
              id,
              name: subdomain?.name || 'Unknown',
              type: 'subdomain',
            };
          })
        );

        return {
          path: pathNodes,
          bridges: current.bridges,
          distance: current.path.length - 1,
        };
      }

      const neighbors = graph.get(current.id) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.id)) {
          visited.add(neighbor.id);
          queue.push({
            id: neighbor.id,
            path: [...current.path, neighbor.id],
            bridges: [...current.bridges, neighbor.bridge],
          });
        }
      }
    }

    return null; // No path found
  }

  /**
   * Get dependency chain for an MCP (upstream and downstream)
   */
  static async getDependencyChain(mcpId: string) {
    const upstreamDeps = await db.query.mcpDependencies.findMany({
      where: eq(mcpDependencies.targetMcpId, mcpId),
      with: {
        sourceMcp: {
          with: {
            subdomain: {
              with: {
                domain: true,
              },
            },
          },
        },
      },
    });

    const downstreamDeps = await db.query.mcpDependencies.findMany({
      where: eq(mcpDependencies.sourceMcpId, mcpId),
      with: {
        targetMcp: {
          with: {
            subdomain: {
              with: {
                domain: true,
              },
            },
          },
        },
      },
    });

    return {
      upstream: upstreamDeps,
      downstream: downstreamDeps,
      totalDependencies: upstreamDeps.length + downstreamDeps.length,
    };
  }

  /**
   * Identify critical MCPs based on connectivity
   */
  static async getCriticalMCPs(): Promise<CriticalMCP[]> {
    const allMcps = await db.query.mcps.findMany({
      with: {
        subdomain: {
          with: {
            domain: true,
          },
        },
      },
    });

    const criticalMcps: CriticalMCP[] = await Promise.all(
      allMcps.map(async (mcp) => {
        const incoming = await db
          .select({ count: sql<number>`count(*)` })
          .from(mcpDependencies)
          .where(eq(mcpDependencies.targetMcpId, mcp.id));

        const outgoing = await db
          .select({ count: sql<number>`count(*)` })
          .from(mcpDependencies)
          .where(eq(mcpDependencies.sourceMcpId, mcp.id));

        const inCount = Number(incoming[0]?.count || 0);
        const outCount = Number(outgoing[0]?.count || 0);

        // Criticality score: weighted sum of connections
        const criticalityScore = inCount * 2 + outCount * 1;

        return {
          id: mcp.id,
          name: mcp.name,
          incomingConnections: inCount,
          outgoingConnections: outCount,
          criticalityScore,
          domain: mcp.subdomain.domain.name,
        };
      })
    );

    return criticalMcps.sort((a, b) => b.criticalityScore - a.criticalityScore);
  }

  /**
   * Suggest new bridges based on workflow patterns
   */
  static async suggestBridges() {
    // Get all workflows and their associated MCPs
    const workflows = await db.query.workflows.findMany({
      with: {
        workflowMcps: {
          with: {
            mcp: {
              with: {
                subdomain: {
                  with: {
                    domain: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const suggestions: Array<{
      sourceSubdomainId: string;
      targetSubdomainId: string;
      reason: string;
      confidence: number;
    }> = [];

    // Analyze workflows to find frequently co-occurring subdomains
    workflows.forEach((workflow) => {
      const subdomains = workflow.workflowMcps.map(
        (wm) => wm.mcp.subdomain
      );

      // Find pairs of subdomains from different domains
      for (let i = 0; i < subdomains.length; i++) {
        for (let j = i + 1; j < subdomains.length; j++) {
          if (subdomains[i].domainId !== subdomains[j].domainId) {
            suggestions.push({
              sourceSubdomainId: subdomains[i].id,
              targetSubdomainId: subdomains[j].id,
              reason: `Co-occur in workflow: ${workflow.name}`,
              confidence: 0.7,
            });
          }
        }
      }
    });

    // Remove duplicates and existing bridges
    const existingBridges = await db.query.crossDomainBridges.findMany();
    const existingPairs = new Set(
      existingBridges.map(
        (b) => `${b.sourceSubdomainId}-${b.targetSubdomainId}`
      )
    );

    const uniqueSuggestions = suggestions.filter(
      (s) =>
        !existingPairs.has(`${s.sourceSubdomainId}-${s.targetSubdomainId}`)
    );

    return uniqueSuggestions;
  }
}
