import { pgTable, uuid, text, timestamp, integer, boolean, jsonb, pgEnum, primaryKey, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const mcpStatusEnum = pgEnum('mcp_status', ['built', 'in-progress', 'planned']);
export const toolStatusEnum = pgEnum('tool_status', ['built', 'in-progress', 'planned']);
export const workflowStatusEnum = pgEnum('workflow_status', ['draft', 'planned', 'in-progress', 'completed', 'archived']);
export const bridgeTypeEnum = pgEnum('bridge_type', ['data_flow', 'process_handoff', 'shared_resource', 'dependency', 'regulatory']);
export const dependencyTypeEnum = pgEnum('dependency_type', ['requires', 'enhances', 'feeds_data', 'optional']);
export const auditActionEnum = pgEnum('audit_action', ['create', 'update', 'delete', 'status_change', 'research_add']);
export const researchTypeEnum = pgEnum('research_type', ['mcps', 'agents', 'workflows', 'tools', 'bridges', 'comprehensive']);
export const suggestionStatusEnum = pgEnum('suggestion_status', ['pending', 'accepted', 'rejected', 'modified']);

// Phase 6C: Persona & Use Case Enums
export const useCaseFrequencyEnum = pgEnum('use_case_frequency', ['multiple_daily', 'daily', 'weekly', 'monthly', 'event_driven', 'seasonal']);
export const useCaseTimePressureEnum = pgEnum('use_case_time_pressure', ['immediate', 'urgent', 'standard', 'flexible']);
export const useCaseBusinessImpactEnum = pgEnum('use_case_business_impact', ['critical', 'high', 'medium', 'low']);
export const useCaseCategoryEnum = pgEnum('use_case_category', ['operational', 'planning', 'compliance', 'communication', 'analysis', 'exception_handling']);
export const useCaseStatusEnum = pgEnum('use_case_status', ['identified', 'analyzed', 'designing', 'building', 'testing', 'deployed', 'measuring']);
export const useCaseStepActorEnum = pgEnum('use_case_step_actor', ['human', 'agent', 'system', 'human_with_agent']);
export const useCaseStepActionTypeEnum = pgEnum('use_case_step_action_type', ['decision', 'data_entry', 'data_lookup', 'calculation', 'communication', 'validation', 'approval', 'notification']);

// 1. Domains
export const domains = pgTable('domains', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),
  color: text('color'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('domains_name_idx').on(table.name),
}));

// 2. Subdomains
export const subdomains = pgTable('subdomains', {
  id: uuid('id').defaultRandom().primaryKey(),
  domainId: uuid('domain_id').notNull().references(() => domains.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  domainIdIdx: index('subdomains_domain_id_idx').on(table.domainId),
  nameIdx: index('subdomains_name_idx').on(table.name),
}));

// 2A. Personas (Phase 6C) - Human roles in the system
export const personas = pgTable('personas', {
  id: uuid('id').defaultRandom().primaryKey(),
  subdomainId: uuid('subdomain_id').notNull().references(() => subdomains.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  name: text('name').notNull(),
  fullTitle: text('full_title'),
  description: text('description'),
  responsibilities: jsonb('responsibilities').$type<string[]>(),
  typicalExperience: text('typical_experience'),
  reportsTo: text('reports_to'),
  teamSizeRange: text('team_size_range'),
  shiftPatterns: jsonb('shift_patterns').$type<string[]>(),
  systemsUsed: jsonb('systems_used').$type<string[]>(),
  painPoints: jsonb('pain_points').$type<string[]>(),
  goals: jsonb('goals').$type<string[]>(),
  airlineTypes: jsonb('airline_types').$type<string[]>(),
  icon: text('icon'),
  sortOrder: integer('sort_order').notNull().default(0),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  subdomainIdIdx: index('personas_subdomain_id_idx').on(table.subdomainId),
  codeIdx: index('personas_code_idx').on(table.code),
  nameIdx: index('personas_name_idx').on(table.name),
}));

// 2B. Use Cases (Phase 6C) - Specific tasks a persona performs
export const useCases = pgTable('use_cases', {
  id: uuid('id').defaultRandom().primaryKey(),
  personaId: uuid('persona_id').notNull().references(() => personas.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  detailedNarrative: text('detailed_narrative'),

  // Timing & Frequency
  frequency: useCaseFrequencyEnum('frequency').notNull().default('event_driven'),
  typicalDurationMinutes: integer('typical_duration_minutes'),
  timePressure: useCaseTimePressureEnum('time_pressure').notNull().default('standard'),
  peakTimes: jsonb('peak_times').$type<string[]>(),

  // Triggers & Context
  triggers: jsonb('triggers').$type<string[]>(),
  preconditions: jsonb('preconditions').$type<string[]>(),
  postconditions: jsonb('postconditions').$type<string[]>(),

  // Complexity & Value
  complexity: integer('complexity').notNull().default(1), // 1-5
  automationPotential: integer('automation_potential').notNull().default(1), // 1-5
  currentPainLevel: integer('current_pain_level').notNull().default(1), // 1-5
  businessImpact: useCaseBusinessImpactEnum('business_impact').notNull().default('medium'),

  // ROI Calculations
  estimatedAnnualOccurrences: integer('estimated_annual_occurrences'),
  estimatedCostPerOccurrence: integer('estimated_cost_per_occurrence'), // in cents
  estimatedAnnualValue: integer('estimated_annual_value'), // in cents

  // Current State
  currentProcess: text('current_process'),
  currentToolsUsed: jsonb('current_tools_used').$type<string[]>(),
  currentTimeMinutes: integer('current_time_minutes'),
  currentSuccessRate: integer('current_success_rate'), // 0-100

  // Future State
  proposedProcess: text('proposed_process'),
  proposedTimeMinutes: integer('proposed_time_minutes'),
  proposedSuccessRate: integer('proposed_success_rate'), // 0-100

  // Classification
  category: useCaseCategoryEnum('category').notNull().default('operational'),
  priority: integer('priority').notNull().default(3), // 1-5
  implementationWave: integer('implementation_wave').notNull().default(1), // 1-3
  status: useCaseStatusEnum('status').notNull().default('identified'),

  relatedUseCases: jsonb('related_use_cases').$type<string[]>(), // other use case IDs
  regulatoryReferences: jsonb('regulatory_references').$type<string[]>(),
  kpis: jsonb('kpis'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  personaIdIdx: index('use_cases_persona_id_idx').on(table.personaId),
  codeIdx: index('use_cases_code_idx').on(table.code),
  statusIdx: index('use_cases_status_idx').on(table.status),
  businessImpactIdx: index('use_cases_business_impact_idx').on(table.businessImpact),
  implementationWaveIdx: index('use_cases_implementation_wave_idx').on(table.implementationWave),
}));

// 2C. Use Case Steps (Phase 6C) - Break down use case into discrete steps
export const useCaseSteps = pgTable('use_case_steps', {
  id: uuid('id').defaultRandom().primaryKey(),
  useCaseId: uuid('use_case_id').notNull().references(() => useCases.id, { onDelete: 'cascade' }),
  stepNumber: integer('step_number').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  actor: useCaseStepActorEnum('actor').notNull().default('human'),
  actionType: useCaseStepActionTypeEnum('action_type').notNull().default('data_entry'),
  currentDurationSeconds: integer('current_duration_seconds'),
  targetDurationSeconds: integer('target_duration_seconds'),
  canAutomate: boolean('can_automate').notNull().default(false),
  automationNotes: text('automation_notes'),
  errorProne: boolean('error_prone').notNull().default(false),
  errorNotes: text('error_notes'),
  systemsInvolved: jsonb('systems_involved').$type<string[]>(),
  dataNeeded: jsonb('data_needed').$type<string[]>(),
  dataProduced: jsonb('data_produced').$type<string[]>(),
  decisionCriteria: text('decision_criteria'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  useCaseIdIdx: index('use_case_steps_use_case_id_idx').on(table.useCaseId),
  stepNumberIdx: index('use_case_steps_step_number_idx').on(table.stepNumber),
}));

// 2D. Day in Life (Phase 6C) - Document a typical shift for a persona
export const dayInLife = pgTable('day_in_life', {
  id: uuid('id').defaultRandom().primaryKey(),
  personaId: uuid('persona_id').notNull().references(() => personas.id, { onDelete: 'cascade' }),
  shiftType: text('shift_type').notNull(),
  narrative: text('narrative'),
  startTime: text('start_time'), // stored as HH:MM
  endTime: text('end_time'), // stored as HH:MM
  totalHours: integer('total_hours'), // in decimal (e.g., 8 for 8 hours)
  timeline: jsonb('timeline'), // array of timeline blocks
  keyChallenges: jsonb('key_challenges').$type<string[]>(),
  decisionPoints: jsonb('decision_points'),
  metricsTracked: jsonb('metrics_tracked').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  personaIdIdx: index('day_in_life_persona_id_idx').on(table.personaId),
}));

// 3. MCPs (Model Context Protocols)
export const mcps = pgTable('mcps', {
  id: uuid('id').defaultRandom().primaryKey(),
  subdomainId: uuid('subdomain_id').notNull().references(() => subdomains.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  status: mcpStatusEnum('status').notNull().default('planned'),
  targetQuarter: text('target_quarter'),
  owner: text('owner'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  subdomainIdIdx: index('mcps_subdomain_id_idx').on(table.subdomainId),
  statusIdx: index('mcps_status_idx').on(table.status),
  nameIdx: index('mcps_name_idx').on(table.name),
}));

// 4. Tools
export const tools = pgTable('tools', {
  id: uuid('id').defaultRandom().primaryKey(),
  mcpId: uuid('mcp_id').notNull().references(() => mcps.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  status: toolStatusEnum('status').notNull().default('planned'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  mcpIdIdx: index('tools_mcp_id_idx').on(table.mcpId),
  statusIdx: index('tools_status_idx').on(table.status),
  nameIdx: index('tools_name_idx').on(table.name),
}));

// 5. Agent Categories
export const agentCategories = pgTable('agent_categories', {
  code: text('code').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),
  color: text('color'),
});

// 6. Agents
export const agents = pgTable('agents', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  categoryCode: text('category_code').notNull().references(() => agentCategories.code, { onDelete: 'restrict' }),
  description: text('description'),
  autonomyLevel: integer('autonomy_level').notNull().default(1),
  mcpId: uuid('mcp_id').references(() => mcps.id, { onDelete: 'set null' }),
  active: boolean('active').notNull().default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  codeIdx: index('agents_code_idx').on(table.code),
  categoryCodeIdx: index('agents_category_code_idx').on(table.categoryCode),
  mcpIdIdx: index('agents_mcp_id_idx').on(table.mcpId),
  activeIdx: index('agents_active_idx').on(table.active),
}));

// 7. Workflows
export const workflows = pgTable('workflows', {
  id: uuid('id').defaultRandom().primaryKey(),
  subdomainId: uuid('subdomain_id').notNull().references(() => subdomains.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  complexity: integer('complexity').notNull().default(1),
  agenticPotential: integer('agentic_potential').notNull().default(1),
  implementationWave: integer('implementation_wave').notNull().default(1),
  status: workflowStatusEnum('status').notNull().default('draft'),
  expectedRoi: text('expected_roi'),
  successMetrics: jsonb('success_metrics'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  subdomainIdIdx: index('workflows_subdomain_id_idx').on(table.subdomainId),
  statusIdx: index('workflows_status_idx').on(table.status),
  implementationWaveIdx: index('workflows_implementation_wave_idx').on(table.implementationWave),
  nameIdx: index('workflows_name_idx').on(table.name),
}));

// 8. Workflow MCPs (Junction Table)
export const workflowMcps = pgTable('workflow_mcps', {
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  mcpId: uuid('mcp_id').notNull().references(() => mcps.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.workflowId, table.mcpId] }),
  workflowIdIdx: index('workflow_mcps_workflow_id_idx').on(table.workflowId),
  mcpIdIdx: index('workflow_mcps_mcp_id_idx').on(table.mcpId),
}));

// 9. Workflow Agents (Junction Table)
export const workflowAgents = pgTable('workflow_agents', {
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  agentId: uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  role: text('role'),
}, (table) => ({
  pk: primaryKey({ columns: [table.workflowId, table.agentId] }),
  workflowIdIdx: index('workflow_agents_workflow_id_idx').on(table.workflowId),
  agentIdIdx: index('workflow_agents_agent_id_idx').on(table.agentId),
}));

// 10. Agent Collaborations (Agent-to-Agent Relationships)
export const agentCollaborations = pgTable('agent_collaborations', {
  id: uuid('id').defaultRandom().primaryKey(),
  sourceAgentId: uuid('source_agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  targetAgentId: uuid('target_agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  collaborationType: text('collaboration_type').notNull(),
  strength: integer('strength').notNull().default(1),
  bidirectional: boolean('bidirectional').notNull().default(false),
}, (table) => ({
  sourceAgentIdIdx: index('agent_collab_source_agent_id_idx').on(table.sourceAgentId),
  targetAgentIdIdx: index('agent_collab_target_agent_id_idx').on(table.targetAgentId),
  collaborationTypeIdx: index('agent_collab_type_idx').on(table.collaborationType),
}));

// 11. Cross-Domain Bridges
export const crossDomainBridges = pgTable('cross_domain_bridges', {
  id: uuid('id').defaultRandom().primaryKey(),
  sourceSubdomainId: uuid('source_subdomain_id').notNull().references(() => subdomains.id, { onDelete: 'cascade' }),
  targetSubdomainId: uuid('target_subdomain_id').notNull().references(() => subdomains.id, { onDelete: 'cascade' }),
  bridgeType: bridgeTypeEnum('bridge_type').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  strength: integer('strength').notNull().default(1),
}, (table) => ({
  sourceSubdomainIdIdx: index('cross_domain_bridges_source_idx').on(table.sourceSubdomainId),
  targetSubdomainIdIdx: index('cross_domain_bridges_target_idx').on(table.targetSubdomainId),
  bridgeTypeIdx: index('cross_domain_bridges_type_idx').on(table.bridgeType),
}));

// 12. MCP Dependencies
export const mcpDependencies = pgTable('mcp_dependencies', {
  id: uuid('id').defaultRandom().primaryKey(),
  sourceMcpId: uuid('source_mcp_id').notNull().references(() => mcps.id, { onDelete: 'cascade' }),
  targetMcpId: uuid('target_mcp_id').notNull().references(() => mcps.id, { onDelete: 'cascade' }),
  dependencyType: dependencyTypeEnum('dependency_type').notNull(),
  description: text('description'),
}, (table) => ({
  sourceMcpIdIdx: index('mcp_dependencies_source_idx').on(table.sourceMcpId),
  targetMcpIdIdx: index('mcp_dependencies_target_idx').on(table.targetMcpId),
  dependencyTypeIdx: index('mcp_dependencies_type_idx').on(table.dependencyType),
}));

// Relations

export const domainsRelations = relations(domains, ({ many }) => ({
  subdomains: many(subdomains),
}));

export const subdomainsRelations = relations(subdomains, ({ one, many }) => ({
  domain: one(domains, {
    fields: [subdomains.domainId],
    references: [domains.id],
  }),
  mcps: many(mcps),
  workflows: many(workflows),
  personas: many(personas), // Phase 6C
  sourceBridges: many(crossDomainBridges, {
    relationName: 'sourceBridges',
  }),
  targetBridges: many(crossDomainBridges, {
    relationName: 'targetBridges',
  }),
}));

// Phase 6C Relations
export const personasRelations = relations(personas, ({ one, many }) => ({
  subdomain: one(subdomains, {
    fields: [personas.subdomainId],
    references: [subdomains.id],
  }),
  useCases: many(useCases),
  dayInLife: many(dayInLife),
}));

export const useCasesRelations = relations(useCases, ({ one, many }) => ({
  persona: one(personas, {
    fields: [useCases.personaId],
    references: [personas.id],
  }),
  steps: many(useCaseSteps),
}));

export const useCaseStepsRelations = relations(useCaseSteps, ({ one }) => ({
  useCase: one(useCases, {
    fields: [useCaseSteps.useCaseId],
    references: [useCases.id],
  }),
}));

export const dayInLifeRelations = relations(dayInLife, ({ one }) => ({
  persona: one(personas, {
    fields: [dayInLife.personaId],
    references: [personas.id],
  }),
}));

export const mcpsRelations = relations(mcps, ({ one, many }) => ({
  subdomain: one(subdomains, {
    fields: [mcps.subdomainId],
    references: [subdomains.id],
  }),
  tools: many(tools),
  agents: many(agents),
  workflowMcps: many(workflowMcps),
  sourceDependencies: many(mcpDependencies, {
    relationName: 'sourceDependencies',
  }),
  targetDependencies: many(mcpDependencies, {
    relationName: 'targetDependencies',
  }),
}));

export const toolsRelations = relations(tools, ({ one }) => ({
  mcp: one(mcps, {
    fields: [tools.mcpId],
    references: [mcps.id],
  }),
}));

export const agentCategoriesRelations = relations(agentCategories, ({ many }) => ({
  agents: many(agents),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  category: one(agentCategories, {
    fields: [agents.categoryCode],
    references: [agentCategories.code],
  }),
  mcp: one(mcps, {
    fields: [agents.mcpId],
    references: [mcps.id],
  }),
  workflowAgents: many(workflowAgents),
  sourceCollaborations: many(agentCollaborations, {
    relationName: 'sourceCollaborations',
  }),
  targetCollaborations: many(agentCollaborations, {
    relationName: 'targetCollaborations',
  }),
}));

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  subdomain: one(subdomains, {
    fields: [workflows.subdomainId],
    references: [subdomains.id],
  }),
  workflowMcps: many(workflowMcps),
  workflowAgents: many(workflowAgents),
}));

export const workflowMcpsRelations = relations(workflowMcps, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowMcps.workflowId],
    references: [workflows.id],
  }),
  mcp: one(mcps, {
    fields: [workflowMcps.mcpId],
    references: [mcps.id],
  }),
}));

export const workflowAgentsRelations = relations(workflowAgents, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowAgents.workflowId],
    references: [workflows.id],
  }),
  agent: one(agents, {
    fields: [workflowAgents.agentId],
    references: [agents.id],
  }),
}));

export const agentCollaborationsRelations = relations(agentCollaborations, ({ one }) => ({
  sourceAgent: one(agents, {
    fields: [agentCollaborations.sourceAgentId],
    references: [agents.id],
    relationName: 'sourceCollaborations',
  }),
  targetAgent: one(agents, {
    fields: [agentCollaborations.targetAgentId],
    references: [agents.id],
    relationName: 'targetCollaborations',
  }),
}));

export const crossDomainBridgesRelations = relations(crossDomainBridges, ({ one }) => ({
  sourceSubdomain: one(subdomains, {
    fields: [crossDomainBridges.sourceSubdomainId],
    references: [subdomains.id],
    relationName: 'sourceBridges',
  }),
  targetSubdomain: one(subdomains, {
    fields: [crossDomainBridges.targetSubdomainId],
    references: [subdomains.id],
    relationName: 'targetBridges',
  }),
}));

export const mcpDependenciesRelations = relations(mcpDependencies, ({ one }) => ({
  sourceMcp: one(mcps, {
    fields: [mcpDependencies.sourceMcpId],
    references: [mcps.id],
    relationName: 'sourceDependencies',
  }),
  targetMcp: one(mcps, {
    fields: [mcpDependencies.targetMcpId],
    references: [mcps.id],
    relationName: 'targetDependencies',
  }),
}));

// 13. Audit Log
export const auditLog = pgTable('audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  entityName: text('entity_name'),
  action: auditActionEnum('action').notNull(),
  actor: text('actor').notNull(),
  reason: text('reason'),
  previousState: jsonb('previous_state'),
  newState: jsonb('new_state'),
  dependencyContext: jsonb('dependency_context'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  entityTypeIdIdx: index('audit_log_entity_type_id_idx').on(table.entityType, table.entityId),
  createdAtIdx: index('audit_log_created_at_idx').on(table.createdAt),
  actorIdx: index('audit_log_actor_idx').on(table.actor),
}));

// 14. Research Sessions
export const researchSessions = pgTable('research_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  domainId: uuid('domain_id').references(() => domains.id, { onDelete: 'set null' }),
  subdomainId: uuid('subdomain_id').references(() => subdomains.id, { onDelete: 'set null' }),
  researchType: researchTypeEnum('research_type').notNull(),
  promptContext: jsonb('prompt_context'),
  responseRaw: jsonb('response_raw'),
  suggestionsCount: integer('suggestions_count').notNull().default(0),
  acceptedCount: integer('accepted_count').notNull().default(0),
  rejectedCount: integer('rejected_count').notNull().default(0),
  actor: text('actor').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  domainIdIdx: index('research_sessions_domain_id_idx').on(table.domainId),
  subdomainIdIdx: index('research_sessions_subdomain_id_idx').on(table.subdomainId),
  createdAtIdx: index('research_sessions_created_at_idx').on(table.createdAt),
}));

// 15. Research Suggestions
export const researchSuggestions = pgTable('research_suggestions', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull().references(() => researchSessions.id, { onDelete: 'cascade' }),
  suggestionType: text('suggestion_type').notNull(),
  suggestedData: jsonb('suggested_data').notNull(),
  status: suggestionStatusEnum('status').notNull().default('pending'),
  modificationNotes: text('modification_notes'),
  acceptedEntityId: uuid('accepted_entity_id'),
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  sessionIdIdx: index('research_suggestions_session_id_idx').on(table.sessionId),
  statusIdx: index('research_suggestions_status_idx').on(table.status),
}));

// Relations for new tables
export const auditLogRelations = relations(auditLog, () => ({}));

export const researchSessionsRelations = relations(researchSessions, ({ one, many }) => ({
  domain: one(domains, {
    fields: [researchSessions.domainId],
    references: [domains.id],
  }),
  subdomain: one(subdomains, {
    fields: [researchSessions.subdomainId],
    references: [subdomains.id],
  }),
  suggestions: many(researchSuggestions),
}));

export const researchSuggestionsRelations = relations(researchSuggestions, ({ one }) => ({
  session: one(researchSessions, {
    fields: [researchSuggestions.sessionId],
    references: [researchSessions.id],
  }),
}));
