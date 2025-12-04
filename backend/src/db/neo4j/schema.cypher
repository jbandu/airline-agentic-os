// Neo4j Graph Schema for Airline Agentic OS
// Run this file to create constraints and indexes

// ============================================
// NODE CONSTRAINTS (ensure uniqueness)
// ============================================

CREATE CONSTRAINT domain_id IF NOT EXISTS FOR (d:Domain) REQUIRE d.id IS UNIQUE;
CREATE CONSTRAINT subdomain_id IF NOT EXISTS FOR (s:Subdomain) REQUIRE s.id IS UNIQUE;
CREATE CONSTRAINT mcp_id IF NOT EXISTS FOR (m:MCP) REQUIRE m.id IS UNIQUE;
CREATE CONSTRAINT tool_id IF NOT EXISTS FOR (t:Tool) REQUIRE t.id IS UNIQUE;
CREATE CONSTRAINT agent_id IF NOT EXISTS FOR (a:Agent) REQUIRE a.id IS UNIQUE;
CREATE CONSTRAINT workflow_id IF NOT EXISTS FOR (w:Workflow) REQUIRE w.id IS UNIQUE;
CREATE CONSTRAINT agent_category_code IF NOT EXISTS FOR (c:AgentCategory) REQUIRE c.code IS UNIQUE;

// ============================================
// INDEXES (for fast lookups)
// ============================================

CREATE INDEX domain_name IF NOT EXISTS FOR (d:Domain) ON (d.name);
CREATE INDEX subdomain_name IF NOT EXISTS FOR (s:Subdomain) ON (s.name);
CREATE INDEX mcp_name IF NOT EXISTS FOR (m:MCP) ON (m.name);
CREATE INDEX mcp_status IF NOT EXISTS FOR (m:MCP) ON (m.status);
CREATE INDEX tool_name IF NOT EXISTS FOR (t:Tool) ON (t.name);
CREATE INDEX tool_status IF NOT EXISTS FOR (t:Tool) ON (t.status);
CREATE INDEX agent_code IF NOT EXISTS FOR (a:Agent) ON (a.code);
CREATE INDEX agent_active IF NOT EXISTS FOR (a:Agent) ON (a.active);
CREATE INDEX workflow_name IF NOT EXISTS FOR (w:Workflow) ON (w.name);
CREATE INDEX workflow_status IF NOT EXISTS FOR (w:Workflow) ON (w.status);

// ============================================
// NODE TYPES & PROPERTIES
// ============================================

// (:Domain {
//   id: string (UUID),
//   name: string,
//   icon: string,
//   color: string
// })

// (:Subdomain {
//   id: string (UUID),
//   name: string,
//   domainId: string (UUID)
// })

// (:MCP {
//   id: string (UUID),
//   name: string,
//   status: 'built' | 'in-progress' | 'planned',
//   targetQuarter: string,
//   priority: integer,
//   subdomainId: string (UUID)
// })

// (:Tool {
//   id: string (UUID),
//   name: string,
//   status: 'built' | 'in-progress' | 'planned',
//   mcpId: string (UUID)
// })

// (:Agent {
//   id: string (UUID),
//   code: string,
//   name: string,
//   autonomyLevel: integer (1-5),
//   active: boolean,
//   activeInstances: integer,
//   categoryCode: string
// })

// (:AgentCategory {
//   code: string (primary key),
//   name: string,
//   icon: string,
//   color: string
// })

// (:Workflow {
//   id: string (UUID),
//   name: string,
//   status: 'draft' | 'planned' | 'in-progress' | 'completed' | 'archived',
//   complexity: integer (1-5),
//   wave: integer (1-3),
//   subdomainId: string (UUID)
// })

// ============================================
// RELATIONSHIP TYPES
// ============================================

// Domain-Subdomain hierarchy
// (Domain)-[:HAS_SUBDOMAIN]->(Subdomain)
// (Subdomain)-[:BELONGS_TO_DOMAIN]->(Domain)

// Subdomain-MCP hierarchy
// (Subdomain)-[:HAS_MCP]->(MCP)
// (MCP)-[:BELONGS_TO_SUBDOMAIN]->(Subdomain)

// MCP-Tool hierarchy
// (MCP)-[:HAS_TOOL]->(Tool)
// (Tool)-[:BELONGS_TO_MCP]->(MCP)

// Agent-Category membership
// (Agent)-[:BELONGS_TO_CATEGORY]->(AgentCategory)

// Agent-MCP usage
// (Agent)-[:USES_MCP {role: 'primary'|'secondary'}]->(MCP)

// Agent collaborations
// (Agent)-[:COLLABORATES_WITH {
//   type: string,
//   strength: integer (1-5),
//   bidirectional: boolean
// }]->(Agent)

// Workflow relationships
// (Workflow)-[:BELONGS_TO_SUBDOMAIN]->(Subdomain)
// (Workflow)-[:POWERED_BY {role: string}]->(MCP)
// (Workflow)-[:EXECUTED_BY {role: string}]->(Agent)

// MCP dependencies
// (MCP)-[:DEPENDS_ON {
//   type: 'requires'|'enhances'|'feeds_data'|'optional',
//   isCritical: boolean
// }]->(MCP)

// Cross-domain bridges
// (Subdomain)-[:BRIDGES_TO {
//   type: 'data_flow'|'process_handoff'|'shared_resource'|'dependency'|'regulatory',
//   name: string,
//   strength: integer (1-5),
//   isCritical: boolean
// }]->(Subdomain)

// ============================================
// VERIFICATION QUERIES
// ============================================

// Count all nodes by type
// MATCH (n) RETURN labels(n) as nodeType, count(*) as count;

// Count all relationships by type
// MATCH ()-[r]->() RETURN type(r) as relType, count(*) as count;

// Check for orphaned nodes
// MATCH (n) WHERE NOT (n)--() RETURN labels(n), count(*);
