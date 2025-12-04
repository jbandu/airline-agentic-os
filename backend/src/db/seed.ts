import dotenv from 'dotenv';
dotenv.config();

import { db } from './index';
import {
  domains,
  subdomains,
  mcps,
  tools,
  agentCategories,
  agents,
  workflows,
  workflowMcps,
  workflowAgents,
  agentCollaborations,
  crossDomainBridges,
  mcpDependencies,
} from './schema';

async function seed() {
  console.log('Starting seed...');

  try {
    // 1. Seed Domains
    console.log('Seeding domains...');
    const [operationsDomain, customerServiceDomain, maintenanceDomain] = await db
      .insert(domains)
      .values([
        {
          name: 'Flight Operations',
          description: 'Core flight planning, scheduling, and execution',
          icon: '✈️',
          color: '#3B82F6',
        },
        {
          name: 'Customer Service',
          description: 'Passenger experience and support',
          icon: '👥',
          color: '#10B981',
        },
        {
          name: 'Aircraft Maintenance',
          description: 'Fleet health and maintenance operations',
          icon: '🔧',
          color: '#F59E0B',
        },
      ])
      .returning();

    // 2. Seed Subdomains
    console.log('Seeding subdomains...');
    const [baggageSubdomain, rebookingSubdomain, crewSubdomain] = await db
      .insert(subdomains)
      .values([
        {
          domainId: operationsDomain.id,
          name: 'Baggage Operations',
          description: 'Baggage tracking and handling',
        },
        {
          domainId: customerServiceDomain.id,
          name: 'Rebooking & Recovery',
          description: 'Flight disruption management',
        },
        {
          domainId: operationsDomain.id,
          name: 'Crew Management',
          description: 'Crew scheduling and coordination',
        },
      ])
      .returning();

    // 3. Seed Agent Categories
    console.log('Seeding agent categories...');
    await db.insert(agentCategories).values([
      {
        code: 'ORCHESTRATOR',
        name: 'Orchestrator',
        description: 'High-level coordination and decision-making',
        icon: '🎯',
        color: '#8B5CF6',
      },
      {
        code: 'SPECIALIST',
        name: 'Specialist',
        description: 'Domain-specific expertise',
        icon: '🔬',
        color: '#EC4899',
      },
      {
        code: 'EXECUTOR',
        name: 'Executor',
        description: 'Task execution and automation',
        icon: '⚡',
        color: '#06B6D4',
      },
      {
        code: 'MONITOR',
        name: 'Monitor',
        description: 'System monitoring and alerting',
        icon: '👁️',
        color: '#84CC16',
      },
    ]);

    // 4. Seed MCPs
    console.log('Seeding MCPs...');
    const [baggageMcp, rebookingMcp, crewMcp] = await db
      .insert(mcps)
      .values([
        {
          subdomainId: baggageSubdomain.id,
          name: 'Baggage Tracking MCP',
          description: 'Real-time baggage location and status tracking',
          status: 'built',
          targetQuarter: 'Q1-2025',
          owner: 'Operations Team',
        },
        {
          subdomainId: rebookingSubdomain.id,
          name: 'Rebooking Intelligence MCP',
          description: 'Smart rebooking recommendations and automation',
          status: 'in-progress',
          targetQuarter: 'Q2-2025',
          owner: 'Customer Service Team',
        },
        {
          subdomainId: crewSubdomain.id,
          name: 'Crew Optimization MCP',
          description: 'Crew scheduling and duty time optimization',
          status: 'planned',
          targetQuarter: 'Q3-2025',
          owner: 'Crew Operations',
        },
      ])
      .returning();

    // 5. Seed Tools
    console.log('Seeding tools...');
    await db.insert(tools).values([
      {
        mcpId: baggageMcp.id,
        name: 'track_baggage_location',
        description: 'Get real-time location of baggage by tag ID',
        status: 'built',
      },
      {
        mcpId: baggageMcp.id,
        name: 'predict_mishandling_risk',
        description: 'Predict likelihood of baggage mishandling',
        status: 'built',
      },
      {
        mcpId: rebookingMcp.id,
        name: 'find_alternative_flights',
        description: 'Search for alternative flight options',
        status: 'in-progress',
      },
      {
        mcpId: rebookingMcp.id,
        name: 'calculate_compensation',
        description: 'Calculate passenger compensation based on regulations',
        status: 'in-progress',
      },
      {
        mcpId: crewMcp.id,
        name: 'optimize_crew_rotation',
        description: 'Optimize crew scheduling for duty time compliance',
        status: 'planned',
      },
    ]);

    // 6. Seed Agents
    console.log('Seeding agents...');
    const [baggageAgent, rebookingAgent, crewAgent, monitorAgent] = await db
      .insert(agents)
      .values([
        {
          code: 'BAGGAGE_ORCHESTRATOR',
          name: 'Baggage Operations Agent',
          categoryCode: 'ORCHESTRATOR',
          description: 'Orchestrates baggage tracking and mishandling resolution',
          autonomyLevel: 4,
          mcpId: baggageMcp.id,
          active: true,
          metadata: {
            capabilities: ['tracking', 'risk-prediction', 'resolution'],
            maxConcurrentTasks: 100,
          },
        },
        {
          code: 'REBOOKING_SPECIALIST',
          name: 'Rebooking Specialist Agent',
          categoryCode: 'SPECIALIST',
          description: 'Specialized in passenger rebooking and compensation',
          autonomyLevel: 3,
          mcpId: rebookingMcp.id,
          active: true,
          metadata: {
            capabilities: ['search', 'booking', 'compensation'],
          },
        },
        {
          code: 'CREW_OPTIMIZER',
          name: 'Crew Optimization Agent',
          categoryCode: 'EXECUTOR',
          description: 'Executes crew scheduling optimizations',
          autonomyLevel: 2,
          mcpId: crewMcp.id,
          active: false,
          metadata: {
            capabilities: ['scheduling', 'compliance-checking'],
          },
        },
        {
          code: 'OPS_MONITOR',
          name: 'Operations Monitor Agent',
          categoryCode: 'MONITOR',
          description: 'Monitors all operational systems for anomalies',
          autonomyLevel: 5,
          mcpId: null,
          active: true,
          metadata: {
            alertThresholds: {
              baggageDelay: 30,
              flightDelay: 15,
            },
          },
        },
      ])
      .returning();

    // 7. Seed Workflows
    console.log('Seeding workflows...');
    const [baggageWorkflow, rebookingWorkflow] = await db
      .insert(workflows)
      .values([
        {
          subdomainId: baggageSubdomain.id,
          name: 'Proactive Baggage Mishandling Prevention',
          description: 'Predict and prevent baggage mishandling before it occurs',
          complexity: 4,
          agenticPotential: 5,
          implementationWave: 1,
          status: 'in-progress',
          expectedRoi: '25% reduction in mishandling incidents',
          successMetrics: {
            mishandlingReduction: 25,
            customerSatisfaction: 15,
            costSavings: 500000,
          },
        },
        {
          subdomainId: rebookingSubdomain.id,
          name: 'Automated Passenger Rebooking',
          description: 'Automatically rebook passengers on disrupted flights',
          complexity: 5,
          agenticPotential: 4,
          implementationWave: 1,
          status: 'planned',
          expectedRoi: '40% faster rebooking, 30% cost reduction',
          successMetrics: {
            rebookingSpeed: 40,
            agentTimeReduction: 30,
            passengerSatisfaction: 20,
          },
        },
      ])
      .returning();

    // 8. Seed Workflow-MCP associations
    console.log('Seeding workflow-MCP associations...');
    await db.insert(workflowMcps).values([
      { workflowId: baggageWorkflow.id, mcpId: baggageMcp.id },
      { workflowId: rebookingWorkflow.id, mcpId: rebookingMcp.id },
    ]);

    // 9. Seed Workflow-Agent associations
    console.log('Seeding workflow-agent associations...');
    await db.insert(workflowAgents).values([
      {
        workflowId: baggageWorkflow.id,
        agentId: baggageAgent.id,
        role: 'Primary Orchestrator',
      },
      {
        workflowId: baggageWorkflow.id,
        agentId: monitorAgent.id,
        role: 'System Monitor',
      },
      {
        workflowId: rebookingWorkflow.id,
        agentId: rebookingAgent.id,
        role: 'Rebooking Specialist',
      },
    ]);

    // 10. Seed Agent Collaborations
    console.log('Seeding agent collaborations...');
    await db.insert(agentCollaborations).values([
      {
        sourceAgentId: baggageAgent.id,
        targetAgentId: monitorAgent.id,
        collaborationType: 'alert_subscription',
        strength: 5,
        bidirectional: false,
      },
      {
        sourceAgentId: rebookingAgent.id,
        targetAgentId: monitorAgent.id,
        collaborationType: 'status_reporting',
        strength: 4,
        bidirectional: false,
      },
    ]);

    // 11. Seed Cross-Domain Bridges
    console.log('Seeding cross-domain bridges...');
    await db.insert(crossDomainBridges).values([
      {
        sourceSubdomainId: baggageSubdomain.id,
        targetSubdomainId: rebookingSubdomain.id,
        bridgeType: 'data_flow',
        name: 'Baggage Status to Rebooking',
        description: 'Share baggage delay information with rebooking system',
        strength: 4,
      },
    ]);

    // 12. Seed MCP Dependencies
    console.log('Seeding MCP dependencies...');
    await db.insert(mcpDependencies).values([
      {
        sourceMcpId: rebookingMcp.id,
        targetMcpId: baggageMcp.id,
        dependencyType: 'feeds_data',
        description: 'Rebooking MCP uses baggage status for decision making',
      },
    ]);

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Error during seed:', error);
    throw error;
  }
}

// Run seed
seed()
  .then(() => {
    console.log('Database seeded successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
