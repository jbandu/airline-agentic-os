export type NodeType = 'domain' | 'subdomain' | 'mcp' | 'agent';
export type EdgeType = 'hierarchy' | 'mcp-agent' | 'cross-domain' | 'collaboration';
export type NodeStatus = 'built' | 'in-progress' | 'planned' | 'active' | 'inactive';

export interface GraphNode {
  id: string;
  type: NodeType;
  name: string;
  parentId?: string;
  status?: NodeStatus;
  color?: string;
  icon?: string;
  categoryCode?: string;
  metadata?: {
    subdomainCount?: number;
    mcpCount?: number;
    toolCount?: number;
    autonomyLevel?: number;
    [key: string]: any;
  };
  // D3 force simulation properties
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
}

export interface GraphEdge {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type: EdgeType;
  strength?: number;
  bidirectional?: boolean;
}

export interface GraphFilters {
  nodeTypes: Set<NodeType>;
  domains: Set<string>;
  statuses: Set<NodeStatus>;
  searchQuery: string;
}

export interface ForceGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  filters?: GraphFilters;
  onNodeClick?: (node: GraphNode) => void;
  onNodeHover?: (node: GraphNode | null) => void;
  width?: number;
  height?: number;
}

export interface TooltipData {
  node: GraphNode;
  x: number;
  y: number;
}
