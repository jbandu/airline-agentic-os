// Core entity types

export interface Domain {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  subdomains?: Subdomain[];
}

export interface Subdomain {
  id: string;
  domainId: string;
  name: string;
  description?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  domain?: Domain;
  mcps?: MCP[];
  workflows?: Workflow[];
}

export interface MCP {
  id: string;
  subdomainId: string;
  name: string;
  description?: string;
  status: 'built' | 'in-progress' | 'planned';
  targetQuarter?: string;
  owner?: string;
  priority: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  subdomain?: Subdomain;
  tools?: Tool[];
  agents?: Agent[];
  workflowMcps?: WorkflowMCP[];
}

export interface Tool {
  id: string;
  mcpId: string;
  name: string;
  description?: string;
  status: 'built' | 'in-progress' | 'planned';
  parametersSchema?: any;
  returnSchema?: any;
  createdAt: string;
  updatedAt: string;
  mcp?: MCP;
}

export interface AgentCategory {
  code: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface Agent {
  id: string;
  code: string;
  name: string;
  categoryCode: string;
  description?: string;
  autonomyLevel: number;
  primaryMcpId?: string;
  active: boolean;
  activeInstances: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  category?: AgentCategory;
  primaryMcp?: MCP;
}

export interface Workflow {
  id: string;
  subdomainId: string;
  name: string;
  description?: string;
  complexity: number;
  agenticPotential: number;
  autonomyLevel: number;
  implementationWave: number;
  status: 'draft' | 'planned' | 'in-progress' | 'completed' | 'archived';
  expectedRoi?: string;
  successMetrics?: any;
  airlineTypes?: string[];
  systemsInvolved?: string[];
  aiEnablers?: string[];
  createdAt: string;
  updatedAt: string;
  subdomain?: Subdomain;
}

export interface WorkflowMCP {
  id: string;
  workflowId: string;
  mcpId: string;
  role: string;
  workflow?: Workflow;
  mcp?: MCP;
}

export interface WorkflowAgent {
  id: string;
  workflowId: string;
  agentId: string;
  role: string;
  workflow?: Workflow;
  agent?: Agent;
}

export interface CrossDomainBridge {
  id: string;
  sourceSubdomainId: string;
  targetSubdomainId: string;
  bridgeType: 'data_flow' | 'process_handoff' | 'shared_resource' | 'dependency' | 'regulatory';
  name: string;
  description?: string;
  strength: number;
  isCritical: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MCPDependency {
  id: string;
  sourceMcpId: string;
  targetMcpId: string;
  dependencyType: 'requires' | 'enhances' | 'feeds_data' | 'optional';
  description?: string;
  sourceMcp?: MCP;
  targetMcp?: MCP;
}

export interface AgentCollaboration {
  id: string;
  sourceAgentId: string;
  targetAgentId: string;
  collaborationType: string;
  strength: number;
  bidirectional: boolean;
  description?: string;
}

// Dependency checking types

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
  requiresReason: boolean;
}

export interface GraphNode {
  id: string;
  type: string;
  name: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

export interface DependencyCheckResult {
  allowed: boolean;
  blockType: 'hard' | 'soft' | 'none';
  hardBlocks: HardBlock[];
  softBlocks: SoftBlock[];
  dependencyGraph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  contextForAI: {
    entityType: string;
    entityName: string;
    action: string;
    allDependencies: any;
    activeRules: string[];
  };
}

// Research types

export type ResearchType = 'mcps' | 'agents' | 'workflows' | 'tools' | 'bridges' | 'comprehensive';

export interface ResearchParams {
  domainId?: string;
  subdomainId?: string;
  researchType: ResearchType;
}

export interface Suggestion {
  id: string;
  sessionId: string;
  suggestionType: string;
  suggestedData: any;
  status: 'pending' | 'accepted' | 'rejected' | 'modified';
  modificationNotes?: string;
  acceptedEntityId?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface ResearchResult {
  sessionId: string;
  suggestions: Suggestion[];
  context: any;
}

// Audit types

export type AuditAction = 'create' | 'update' | 'delete' | 'status_change' | 'research_add';

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  action: AuditAction;
  actor: string;
  reason?: string;
  previousState?: any;
  newState?: any;
  dependencyContext?: any;
  metadata?: any;
  createdAt: string;
}

export interface AuditFilters {
  entityType?: string;
  entityId?: string;
  actor?: string;
  action?: AuditAction;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// Stats types

export interface OverviewStats {
  domains: number;
  subdomains: number;
  mcps: number;
  tools: number;
  agents: number;
  workflows: number;
  bridges: number;
}

export interface BuildProgress {
  totalMCPs: number;
  builtMCPs: number;
  inProgressMCPs: number;
  plannedMCPs: number;
  totalTools: number;
  builtTools: number;
  percentComplete: number;
}

// API response types

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  count: number;
  hasMore?: boolean;
  offset?: number;
}

// Form input types

export interface CreateDomainInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface UpdateDomainInput extends Partial<CreateDomainInput> {
  reason?: string;
}

export interface CreateMCPInput {
  subdomainId: string;
  name: string;
  description?: string;
  status?: 'built' | 'in-progress' | 'planned';
  targetQuarter?: string;
  owner?: string;
  priority?: number;
}

export interface UpdateMCPInput extends Partial<CreateMCPInput> {
  reason?: string;
}

export interface CreateToolInput {
  mcpId: string;
  name: string;
  description?: string;
  status?: 'built' | 'in-progress' | 'planned';
}

export interface CreateAgentInput {
  code: string;
  name: string;
  categoryCode: string;
  description?: string;
  autonomyLevel?: number;
  primaryMcpId?: string;
}

export interface CreateWorkflowInput {
  subdomainId: string;
  name: string;
  description?: string;
  complexity?: number;
  agenticPotential?: number;
  autonomyLevel?: number;
  implementationWave?: number;
  status?: 'draft' | 'planned' | 'in-progress' | 'completed' | 'archived';
}

// Filters

export interface MCPFilters {
  status?: string;
  domainId?: string;
  subdomainId?: string;
}

export interface AgentFilters {
  categoryCode?: string;
  active?: boolean;
}

// Graph visualization types

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ForceGraphNode extends GraphNode {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  icon?: string;
  color?: string;
  status?: string;
  toolCount?: number;
  domainColor?: string;
  categoryColor?: string;
}

export interface ForceGraphEdge extends GraphEdge {
  strength?: number;
  isCritical?: boolean;
}
