import { useMemo } from 'react';
import { useDomains, useSubdomains, useMCPs, useBridges } from './useEntities';

export interface GraphNode {
  id: string;
  type: 'domain' | 'subdomain' | 'mcp';
  name: string;
  icon?: string;
  color?: string;
  status?: string;
  toolCount?: number;
  domainColor?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  strength?: number;
  isCritical?: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function useGraphData() {
  const { data: domains, isLoading: domainsLoading } = useDomains();
  const { data: subdomains, isLoading: subdomainsLoading } = useSubdomains();
  const { data: mcps, isLoading: mcpsLoading } = useMCPs();
  const { data: bridges, isLoading: bridgesLoading } = useBridges();

  const isLoading = domainsLoading || subdomainsLoading || mcpsLoading || bridgesLoading;

  const graphData = useMemo((): GraphData => {
    if (!domains || !subdomains || !mcps || !bridges) {
      return { nodes: [], edges: [] };
    }

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Add domain nodes
    domains.forEach((domain: any) => {
      nodes.push({
        id: domain.id,
        type: 'domain',
        name: domain.name,
        icon: domain.icon,
        color: domain.color,
      });
    });

    // Add subdomain nodes and edges to domains
    subdomains.forEach((subdomain: any) => {
      nodes.push({
        id: subdomain.id,
        type: 'subdomain',
        name: subdomain.name,
        domainColor: subdomain.domain?.color,
      });

      // Edge from domain to subdomain
      if (subdomain.domainId) {
        edges.push({
          source: subdomain.domainId,
          target: subdomain.id,
          type: 'contains',
        });
      }
    });

    // Add MCP nodes and edges to subdomains
    mcps.forEach((mcp: any) => {
      nodes.push({
        id: mcp.id,
        type: 'mcp',
        name: mcp.name,
        status: mcp.status,
        toolCount: mcp.tools?.length || 0,
        domainColor: mcp.subdomain?.domain?.color,
      });

      // Edge from subdomain to MCP
      if (mcp.subdomainId) {
        edges.push({
          source: mcp.subdomainId,
          target: mcp.id,
          type: 'contains',
        });
      }
    });

    // Add bridge edges
    bridges.forEach((bridge: any) => {
      edges.push({
        source: bridge.sourceSubdomainId,
        target: bridge.targetSubdomainId,
        type: bridge.bridgeType || 'bridge',
        strength: bridge.strength,
        isCritical: bridge.isCritical,
      });
    });

    return { nodes, edges };
  }, [domains, subdomains, mcps, bridges]);

  return {
    data: graphData,
    isLoading,
    domains: domains || [],
    subdomains: subdomains || [],
    mcps: mcps || [],
    bridges: bridges || [],
  };
}
