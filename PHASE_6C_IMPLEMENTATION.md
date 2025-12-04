# Phase 6C: Persona-Driven Use Cases Implementation Guide

**Status:** Ready for Implementation
**Priority:** HIGH - Critical for Copa Airlines Demo
**Complexity:** 8/10 (Major schema changes, new UI patterns)

## Overview

Phase 6C adds the critical "human layer" to the system - **Personas** and their **Use Cases**. This implements the team's decision to use a **use-case-first approach**: start with "a day in the life" of each persona, then derive what workflows, agents, MCPs, and tools are needed.

## Key Decisions from Team Discussion

1. **Hybrid MCP/API Approach**: MCPs for discoverability/open queries, APIs for fast deterministic workflows
2. **Copa First**: Build for Copa, then make framework repeatable
3. **Neo4j**: Yes - for learning + tech differentiation
4. **Testing Must Be Demonstrated**: Certification matters for customer trust
5. **Use Case First**: Always start with the persona's actual work, then determine tech needed

## The Complete Hierarchy

```
Domain (e.g., Flight Operations)
  └── Subdomain (e.g., Crew Management)
        └── Persona (e.g., Crew Controller)
              └── Day in Life
                    └── Use Cases (e.g., Handle Sick Call)
                          └── Use Case Steps
                          └── Workflows (implement the use case)
                                └── Agents (execute workflows)
                                      └── MCPs / APIs
                                            └── Tools
                                                  └── Data Sources
```

## Database Schema Changes

### New Core Tables

#### 1. **personas** - Human Roles in the System

Captures who does the work: Crew Controllers, Dispatchers, Gate Agents, etc.

```typescript
{
  id: uuid
  subdomain_id: uuid → subdomains.id
  code: 'CREW_CTRL' | 'DISPATCHER' | 'GATE_AGENT'
  name: 'Crew Controller'
  full_title: 'Operations Control Center Crew Controller'
  description: text
  responsibilities: text[] // Key duties
  typical_experience: '5-10 years airline ops'
  reports_to: 'OCC Manager'
  team_size_range: '1-3 per shift'
  shift_patterns: ['Day', 'Swing', 'Night']
  systems_used: text[] // Current systems they access
  pain_points: text[] // Current frustrations ⚡
  goals: text[] // What success looks like
  airline_types: ['network', 'low_cost', 'regional']
  icon: emoji
  sort_order: integer
  metadata: jsonb
}
```

**Why This Matters**: Understanding pain points drives feature prioritization. If a Crew Controller's #1 pain point is "I spend 2 hours manually calling reserves," that's your first automation target.

#### 2. **persona_interactions** - How Personas Work Together

```typescript
{
  source_persona_id: uuid → personas.id
  target_persona_id: uuid → personas.id
  interaction_type: 'reports_to' | 'collaborates_with' | 'escalates_to' | 'delegates_to' | 'informs'
  frequency: 'constant' | 'frequent' | 'occasional' | 'rare'
  description: text
}
```

**Example**: "Crew Controller escalates to OCC Manager when no reserves available" (frequent)

#### 3. **use_cases** - Specific Tasks a Persona Performs

This is the CORE of the use-case-first approach. Every workflow starts here.

```typescript
{
  id: uuid
  persona_id: uuid → personas.id
  code: 'UC-CC-001' // Use Case - Crew Controller - 001
  name: 'Handle Crew Sick Call'
  description: text
  detailed_narrative: markdown // Full story

  // Timing & Frequency
  frequency: 'multiple_daily' | 'daily' | 'weekly' | 'monthly' | 'event_driven' | 'seasonal'
  typical_duration_minutes: 30
  time_pressure: 'immediate' | 'urgent' | 'standard' | 'flexible'
  peak_times: ['Early Morning', 'Before Hub Banks']

  // Triggers
  triggers: ['Crew member calls sick', 'No-show detected', 'Last minute unavailability']
  preconditions: ['Flight is scheduled', 'Crew assignment exists']
  postconditions: ['Replacement crew assigned', 'All systems updated', 'Crew notified']

  // Complexity & Value
  complexity: 1-5 // How hard is this?
  automation_potential: 1-5 // How much can AI help?
  current_pain_level: 1-5 // How painful is this today?
  business_impact: 'critical' | 'high' | 'medium' | 'low'

  // ROI Calculations
  estimated_annual_occurrences: 500 // How many times per year
  estimated_cost_per_occurrence: $150 // Cost each time
  estimated_annual_value: $75,000 // Total annual cost

  // Current vs Future State
  current_process: markdown // How it's done today
  current_tools_used: ['Crew System', 'Excel', 'Phone', 'Email']
  current_time_minutes: 45
  current_success_rate: 85%

  proposed_process: markdown // How it will work with AI
  proposed_time_minutes: 10 // 78% time savings!
  proposed_success_rate: 98% // Better outcomes!

  // Implementation
  category: 'operational' | 'planning' | 'compliance' | 'communication' | 'analysis' | 'exception_handling'
  priority: 1-5
  implementation_wave: 1-3 // When to build it
  status: 'identified' | 'analyzed' | 'designing' | 'building' | 'testing' | 'deployed' | 'measuring'

  related_use_cases: uuid[] // Often done together
  regulatory_references: ['FAR 117.25', 'CBA Section 12.3']
  kpis: jsonb // How to measure success
}
```

**Critical**: The use case captures BOTH current state (pain) and future state (value). This drives prioritization and ROI analysis.

#### 4. **use_case_steps** - Break Down the Process

```typescript
{
  use_case_id: uuid → use_cases.id
  step_number: integer
  name: 'Check crew availability'
  description: text
  actor: 'human' | 'agent' | 'system' | 'human_with_agent'
  action_type: 'decision' | 'data_entry' | 'data_lookup' | 'calculation' | 'communication' | 'validation' | 'approval' | 'notification'
  current_duration_seconds: 120
  target_duration_seconds: 5 // 96% reduction!
  can_automate: true
  automation_notes: 'Agent can query crew availability from multiple sources simultaneously'
  error_prone: true // Flag steps that need attention
  error_notes: 'Manual lookup misses unavailability in secondary systems'
  systems_involved: ['Crew System', 'Training System', 'Medical System']
  data_needed: ['crew roster', 'qualifications', 'rest requirements']
  data_produced: ['available crew list', 'ranked by suitability']
}
```

**Why Steps Matter**: This is where you identify automation opportunities. If a step is:
- Manual + Error-prone + Time-consuming = **High automation value**
- Decision + Complex + Low frequency = **Agent assistance, not full automation**

#### 5. **use_case_workflows** (junction) - Link Use Cases to Workflows

```typescript
{
  use_case_id: uuid → use_cases.id
  workflow_id: uuid → workflows.id
  coverage: 'full' | 'partial' | 'supporting'
  coverage_percentage: 0-100
  notes: 'Handles the main flow, but not edge cases'
}
```

**Example**: Workflow "Auto-Assign Reserve Crew" provides 80% coverage of use case "Handle Sick Call"

#### 6. **day_in_life** - Document a Typical Shift

```typescript
{
  persona_id: uuid → personas.id
  shift_type: 'Day Shift' | 'Night Shift' | 'Peak Season'
  narrative: markdown // Story of the day
  start_time: '06:00'
  end_time: '14:00'
  total_hours: 8

  timeline: jsonb // Structured timeline
  [
    {
      time_range: "06:00-06:30",
      activity: "Shift handover briefing",
      use_cases: ["UC-CC-015"],
      systems: ["Crew System", "Email"],
      notes: "Review overnight events, open assignments"
    },
    {
      time_range: "06:30-08:00",
      activity: "Morning crew availability review",
      use_cases: ["UC-CC-002", "UC-CC-003"],
      systems: ["Crew System"],
      notes: "Peak time for last-minute changes"
    },
    ...
  ]

  key_challenges: [
    "Multiple systems don't talk to each other",
    "No single view of crew availability",
    "Constant interruptions from phone calls"
  ]

  decision_points: jsonb
  metrics_tracked: ['Assignments completed', 'Average resolution time', 'Reserve utilization']
}
```

**Why Day in Life Matters**: Shows where personas spend their time. If they're doing UC-CC-001 twenty times in one shift, that's your highest-leverage automation.

### Enhanced Tool Tables (Certification & Demo Readiness)

#### Extend **tools** table:

```typescript
// Add certification tracking
certification_status: {
  is_certified: boolean,
  certification_date: timestamp,
  certified_by: string,
  certification_notes: string,
  recertification_due: timestamp,
  compliance_checks: [{
    check_name: 'Performance Test',
    status: 'passed' | 'failed' | 'pending',
    checked_date: timestamp,
    checked_by: string,
    notes: string
  }]
}

// Add demo readiness
demo_status: {
  is_demo_ready: boolean,
  demo_environment: 'staging' | 'demo-copa',
  demo_data_available: boolean,
  demo_script_url: string,
  last_demo_date: timestamp,
  demo_feedback: string,
  known_demo_issues: ['Edge case X not handled']
}

customer_visible: boolean
customer_visible_date: timestamp
customer_feedback: jsonb
```

**Critical for Copa**: Tools marked `demo_ready: true` are what you show customers. Certification status builds trust.

### External Systems & Stubs

#### **external_systems** - Track 3rd Party Systems

```typescript
{
  code: 'JEPPESEN' | 'SABRE' | 'AIMS'
  name: 'Jeppesen Crew Management'
  vendor: 'Jeppesen'
  system_type: 'crew_management' | 'flight_ops' | 'reservations'
  integration_status: 'not_started' | 'stubbed' | 'sandbox_access' | 'test_access' | 'production_access'
  stub_quality: 'basic' | 'realistic' | 'production_mirror'
  airlines_using: ['Copa', 'United', 'Delta']
  api_type: 'rest' | 'soap' | 'proprietary'
  documentation_url: string
  contact_info: jsonb
  access_notes: 'Waiting for sandbox credentials'
  known_limitations: ['No real-time updates', 'Batch only']
}
```

**Why**: Until you have real Jeppesen access, you need realistic stubs. This tracks integration progress.

#### **external_system_stubs** - Stubbed Endpoints

```typescript
{
  external_system_id: uuid → external_systems.id
  endpoint_name: 'getCrewAvailability'
  endpoint_type: 'query' | 'command' | 'event'
  stub_implementation: 'static_response' | 'dynamic_mock' | 'recorded_replay' | 'rule_based'
  request_schema: jsonb
  response_schema: jsonb
  sample_responses: [{
    scenario: 'Happy path',
    response: {...},
    latency_ms: 150
  }, {
    scenario: 'No crew available',
    response: {...},
    latency_ms: 150
  }]
  realistic_latency_ms: 150
  error_scenarios: [{
    error_type: 'timeout',
    probability: 0.01
  }]
}
```

**Why**: Lets you build and demo before real system access. Rule-based stubs can simulate complex scenarios.

## API Routes

### Personas

```
GET    /api/personas
GET    /api/personas/:id
POST   /api/personas
PUT    /api/personas/:id
DELETE /api/personas/:id

GET    /api/personas/:id/day-in-life
POST   /api/personas/:id/day-in-life
```

### Use Cases

```
GET    /api/use-cases
GET    /api/use-cases/:id
POST   /api/use-cases
PUT    /api/use-cases/:id
DELETE /api/use-cases/:id

GET    /api/use-cases/:id/steps
POST   /api/use-cases/:id/steps
PUT    /api/use-cases/:id/steps/:stepId
DELETE /api/use-cases/:id/steps/:stepId
PUT    /api/use-cases/:id/steps/reorder

GET    /api/use-cases/:id/roi-analysis
GET    /api/use-cases/:id/automation-analysis

POST   /api/use-cases/:id/link-workflow
POST   /api/use-cases/:id/link-agent
POST   /api/use-cases/:id/link-tool
```

### Tool Certification

```
GET    /api/tools/:id/certification
POST   /api/tools/:id/certification/request
PUT    /api/tools/:id/certification/:certId/review

GET    /api/tools/:id/demo-status
PUT    /api/tools/:id/demo-status
```

### External Systems

```
GET    /api/external-systems
POST   /api/external-systems
GET    /api/external-systems/:id
PUT    /api/external-systems/:id

GET    /api/external-systems/:id/stubs
POST   /api/external-systems/:id/stubs
POST   /api/external-systems/:id/stubs/:stubId/test
```

## Frontend Components

### Navigation Hierarchy

```
/domains → Domain List
/domains/:id → Domain Detail (shows subdomains)
/subdomains/:id → Subdomain Detail (shows personas)
/personas/:id → Persona Detail (shows use cases)
/use-cases/:id → Use Case Detail (shows steps, ROI, resources)
```

### Key Pages

#### PersonaDetail.tsx
- Persona header with icon, name, title
- Quick stats (use cases count, pain points, systems)
- Tabs: Overview, Day in Life, Use Cases, Systems
- Pain points highlighted (red cards)
- Interactions with other personas
- Quick actions (Add use case, Document day in life, AI research)

#### DayInLifeView.tsx
- Shift selector (Day/Swing/Night)
- Interactive timeline showing activities throughout the day
- Use cases touched at each time
- Systems accessed
- Key challenges highlighted
- Summary stats (total hours, use cases touched, systems accessed)

#### UseCaseDetail.tsx
- Use case header with code, status, impact badge
- ROI summary (annual value, ROI percentage)
- Quick stats (frequency, duration, complexity, automation potential)
- Tabs: Overview, Steps, ROI, Resources
- Steps shown as process flow diagram
- ROI analysis: Current State vs Future State vs Savings
- Linked resources: Workflows, Agents, Tools

#### UseCaseSteps Component
- Visual process flow
- Step cards with:
  - Actor (human/agent/system) color-coded
  - Can automate badge
  - Error prone warning
  - Systems involved
  - Data needed/produced
  - Current vs target duration
- Add step button

#### UseCaseROI Component
- Three-column layout:
  - Current State (red) - How it works today
  - Future State (green) - With AI automation
  - Savings (green highlight) - The value
- Annual value calculation
- Payback period
- ROI percentage

## Implementation Priority

### Wave 1: MVP for Copa Demo (2-3 weeks)

1. **Database Schema**: Add all tables
2. **Seed Copa Data**:
   - 3-5 key personas (Crew Controller, Dispatcher, Gate Agent)
   - 10-15 critical use cases
   - 1-2 day-in-life documents
3. **Basic CRUD APIs**: Personas, Use Cases
4. **Essential UI**:
   - Persona list and detail pages
   - Use case list and detail pages
   - Day in life timeline view
5. **ROI Calculator**: Show value to Copa

### Wave 2: Full Feature Set (3-4 weeks)

1. **Advanced Analysis**:
   - Automation analysis
   - Step-by-step breakdown
   - Workflow/agent/tool linking
2. **Certification System**: Tool certification tracking
3. **External Systems**: Stub management for Jeppesen, etc.
4. **AI Features**: Claude-powered use case research

### Wave 3: Scale & Polish (2-3 weeks)

1. **Multi-airline support**: Framework reuse
2. **Advanced visualizations**: Process flow diagrams, Gantt charts
3. **Reporting**: Executive dashboards
4. **Testing & Certification**: Demo readiness tracking

## Sample Copa Personas

### 1. Crew Controller (OCC)
- **Code**: CREW_CTRL
- **Pain Points**:
  - "I spend 2 hours per day manually calling reserves"
  - "No single view of crew availability across all systems"
  - "Constant interruptions - can't focus on complex problems"
  - "Last-minute changes cause cascading disruptions"
- **Goals**:
  - "Assign reserves in under 5 minutes"
  - "Proactively identify potential issues before they happen"
  - "Focus on exceptions, not routine assignments"
- **Key Use Cases**:
  - UC-CC-001: Handle Crew Sick Call
  - UC-CC-002: Assign Reserve Crew
  - UC-CC-003: Manage Last-Minute Schedule Changes
  - UC-CC-004: Ensure Regulatory Compliance (FAR 117)

### 2. Flight Dispatcher
- **Code**: DISPATCHER
- **Pain Points**:
  - "Weather data comes from 3 different systems"
  - "Flight plan optimization is manual and time-consuming"
  - "Hard to balance fuel costs vs. schedule reliability"
- **Goals**:
  - "Optimal flight plans generated in real-time"
  - "Early warning system for weather impacts"
  - "One-click approval for routine flights"
- **Key Use Cases**:
  - UC-FD-001: Create Flight Plan
  - UC-FD-002: Monitor Weather Impact
  - UC-FD-003: Approve Flight Release
  - UC-FD-004: Handle In-Flight Diversions

### 3. Gate Agent
- **Code**: GATE_AGENT
- **Pain Points**:
  - "Passengers ask questions I need to call someone else to answer"
  - "Boarding delays due to missing information"
  - "Too many systems to check for one passenger"
- **Goals**:
  - "Instant answers to passenger questions"
  - "Smooth, on-time boarding"
  - "Handle special requests without supervisor approval"
- **Key Use Cases**:
  - UC-GA-001: Check-in Passenger
  - UC-GA-002: Handle Upgrade Requests
  - UC-GA-003: Resolve Boarding Pass Issues
  - UC-GA-004: Assist Passengers with Special Needs

## ROI Calculation Example

### Use Case: UC-CC-001 "Handle Crew Sick Call"

**Current State:**
- Occurs 500 times/year
- Takes 45 minutes per occurrence
- Success rate: 85% (15% require escalation/rework)
- Cost: $50/hour * 0.75 hours = $37.50 per occurrence
- Failure cost: $500 per failed assignment
- **Annual Cost**: (500 * $37.50) + (500 * 0.15 * $500) = $18,750 + $37,500 = **$56,250**

**Future State (with AI Agent):**
- Still occurs 500 times/year
- Takes 10 minutes per occurrence (agent handles lookup, ranking, notification)
- Success rate: 98% (agent catches edge cases)
- Cost: $50/hour * 0.167 hours = $8.33 per occurrence
- Failure cost: $500 per failed assignment
- **Annual Cost**: (500 * $8.33) + (500 * 0.02 * $500) = $4,165 + $5,000 = **$9,165**

**Savings:**
- Time saved: 291 hours/year
- Cost saved: $47,085/year
- Payback: If agent costs $15K to build, ROI in 4 months
- **ROI: 314% in year 1**

## Migration Path from Current System

### Step 1: Data Import
- Start with existing airline org charts
- Map roles to personas
- Identify 3-5 personas per subdomain

### Step 2: Pain Point Discovery
- Interview sessions with each persona
- Shadow a day in their life
- Document current process for top 10 use cases

### Step 3: Prioritization
- Score each use case on:
  - Frequency (more = higher value)
  - Pain level (higher = more value)
  - Automation potential (higher = easier win)
  - Business impact (critical = do first)
- Wave 1: High frequency + High pain + High automation potential
- Wave 2: Critical business impact
- Wave 3: Everything else

### Step 4: Build & Measure
- Build workflows/agents for Wave 1 use cases
- Deploy to pilot users
- Measure actual time savings, success rate improvement
- Update ROI calculations with real data
- Present results to executives

## Technical Decisions

### MCP vs API Decision Framework

Use **MCP** when:
- Agent needs to discover functionality dynamically
- Schema/parameters change frequently
- Exploratory/research phase
- Low call frequency (< 100/min)
- Cost not critical

Use **API** when:
- Well-defined, deterministic operation
- High call frequency (> 1000/min)
- Latency matters (< 100ms)
- Cost-sensitive
- Production-critical workflow

**Example**: "Search for available crew" starts as MCP (flexible queries), but once locked down, convert to API for performance.

### Tool Certification Checklist

Before marking a tool `certified: true`:
- [ ] Unit tests passing (>90% coverage)
- [ ] Integration tests passing
- [ ] Load test (handles peak load + 50%)
- [ ] Security scan (no vulnerabilities)
- [ ] Code review completed
- [ ] Documentation complete
- [ ] Demo environment working
- [ ] Customer feedback incorporated
- [ ] Regulatory compliance checked (if applicable)

## Questions to Ask Copa

1. **Personas**: "Who are the top 5 roles that would benefit most from AI assistance?"
2. **Pain Points**: "What takes the most time in a typical day? What causes the most stress?"
3. **Use Cases**: "Walk me through your last crew sick call - every step, every system."
4. **ROI**: "How many times per year does this happen? How long does it take? What does failure cost?"
5. **Systems**: "What systems do you use today? Which ones talk to each other? Which don't?"
6. **Priorities**: "If you could automate one thing tomorrow, what would it be?"

## Success Metrics for Phase 6C

- **Personas Documented**: Target 15-20 across all domains
- **Use Cases Identified**: Target 100+ (aim for 5-10 per persona)
- **High-Value Use Cases**: Target 20-30 (Wave 1 + 2)
- **ROI Calculated**: Every Wave 1 use case has before/after analysis
- **Day in Life**: At least 5 personas have detailed day-in-life docs
- **Customer Demo Ready**: 3-5 complete use cases end-to-end

## Files to Create

### Backend
- `backend/src/db/schema.ts` - Add all new tables
- `backend/src/routes/personas.ts` - Persona CRUD + day in life
- `backend/src/routes/use-cases.ts` - Use case CRUD + steps + analysis
- `backend/src/routes/tool-certification.ts` - Certification workflow
- `backend/src/routes/external-systems.ts` - External system management
- `backend/src/services/roi-calculator.ts` - ROI analysis logic
- `backend/src/services/automation-analyzer.ts` - Automation potential analysis

### Frontend
- `frontend/src/pages/Personas.tsx` - Persona list
- `frontend/src/pages/PersonaDetail.tsx` - Persona detail
- `frontend/src/pages/UseCaseDetail.tsx` - Use case detail
- `frontend/src/components/persona/DayInLifeView.tsx` - Timeline visualization
- `frontend/src/components/persona/PersonaCard.tsx` - Persona card
- `frontend/src/components/use-case/UseCaseSteps.tsx` - Step-by-step view
- `frontend/src/components/use-case/UseCaseROI.tsx` - ROI analysis view
- `frontend/src/components/use-case/ProcessFlowDiagram.tsx` - Visual flow
- `frontend/src/hooks/usePersonas.ts` - Persona hooks
- `frontend/src/hooks/useUseCases.ts` - Use case hooks

### Documentation
- `PHASE_6C_IMPLEMENTATION.md` - This file
- `COPA_PERSONAS.md` - Copa-specific persona documentation
- `USE_CASE_TEMPLATE.md` - Template for documenting new use cases

---

**Ready to implement**: Schema changes → API routes → UI components → Seed Copa data → Demo!
