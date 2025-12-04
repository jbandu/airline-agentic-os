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
  console.log('Starting comprehensive airline operations seed...');

  try {
    // 1. Seed 8 Domains
    console.log('Seeding domains...');
    const [
      flightOpsDomain,
      groundOpsDomain,
      commercialDomain,
      customerServiceDomain,
      maintenanceDomain,
      networkDomain,
      financeDomain,
      safetyDomain,
    ] = await db
      .insert(domains)
      .values([
        {
          name: 'Flight Operations',
          description: 'Flight planning, dispatch, crew operations, and flight execution',
          icon: '✈️',
          color: '#3B82F6',
        },
        {
          name: 'Ground Operations',
          description: 'Baggage, ramp, cargo, catering, and fueling operations',
          icon: '🛬',
          color: '#10B981',
        },
        {
          name: 'Commercial',
          description: 'Revenue management, sales, ancillary, and loyalty programs',
          icon: '💰',
          color: '#F59E0B',
        },
        {
          name: 'Customer Service',
          description: 'Reservations, check-in, disruption management, and passenger support',
          icon: '👥',
          color: '#8B5CF6',
        },
        {
          name: 'Maintenance & Engineering',
          description: 'Aircraft maintenance, parts management, and engineering',
          icon: '🔧',
          color: '#EF4444',
        },
        {
          name: 'Network & Schedule',
          description: 'Schedule planning, fleet assignment, and route optimization',
          icon: '🗺️',
          color: '#06B6D4',
        },
        {
          name: 'Finance & Accounting',
          description: 'Revenue and cost accounting, financial reporting',
          icon: '📊',
          color: '#EC4899',
        },
        {
          name: 'Safety & Compliance',
          description: 'Safety management systems and regulatory compliance',
          icon: '🛡️',
          color: '#64748B',
        },
      ])
      .returning();

    // 2. Seed Subdomains
    console.log('Seeding subdomains...');
    const [
      // Flight Operations subdomains
      flightPlanningSD,
      dispatchSD,
      crewOpsSD,
      // Ground Operations subdomains
      baggageSD,
      rampOpsSD,
      cargoSD,
      cateringSD,
      fuelingSD,
      // Commercial subdomains
      revMgmtSD,
      distributionSD,
      ancillarySD,
      loyaltySD,
      // Customer Service subdomains
      reservationsSD,
      checkinSD,
      disruptionMgmtSD,
      // Maintenance subdomains
      lineMaintenanceSD,
      heavyMaintenanceSD,
      partsSD,
      // Network subdomains
      schedulePlanningSD,
      fleetAssignmentSD,
      routeProfitabilitySD,
      // Finance subdomains
      revAccountingSD,
      costAccountingSD,
      // Safety subdomains
      safetyMgmtSD,
      regulatorySD,
    ] = await db
      .insert(subdomains)
      .values([
        // Flight Operations
        { domainId: flightOpsDomain.id, name: 'Flight Planning', description: 'Route planning, fuel optimization, flight plans' },
        { domainId: flightOpsDomain.id, name: 'Dispatch & OCC', description: 'Operations Control Center, real-time monitoring' },
        { domainId: flightOpsDomain.id, name: 'Crew Operations', description: 'Crew scheduling, pairing, pay management' },
        // Ground Operations
        { domainId: groundOpsDomain.id, name: 'Baggage Handling', description: 'Bag tracking, mishandling prevention, lost & found' },
        { domainId: groundOpsDomain.id, name: 'Ramp Operations', description: 'Aircraft turnaround, ground handling' },
        { domainId: groundOpsDomain.id, name: 'Cargo', description: 'Cargo booking, loading, tracking' },
        { domainId: groundOpsDomain.id, name: 'Catering', description: 'Meal planning, catering operations' },
        { domainId: groundOpsDomain.id, name: 'Fueling', description: 'Fuel management, hydrant operations' },
        // Commercial
        { domainId: commercialDomain.id, name: 'Revenue Management', description: 'Pricing, inventory control, demand forecasting' },
        { domainId: commercialDomain.id, name: 'Distribution & Sales', description: 'GDS, direct sales, NDC channels' },
        { domainId: commercialDomain.id, name: 'Ancillary Revenue', description: 'Seat selection, bags, meals, upgrades' },
        { domainId: commercialDomain.id, name: 'Loyalty & FFP', description: 'Frequent flyer program, elite tiers, awards' },
        // Customer Service
        { domainId: customerServiceDomain.id, name: 'Reservations', description: 'Booking management, changes, cancellations' },
        { domainId: customerServiceDomain.id, name: 'Check-in & DCS', description: 'Departure Control System, boarding' },
        { domainId: customerServiceDomain.id, name: 'Disruption Management', description: 'IROP, rebooking, recovery' },
        // Maintenance
        { domainId: maintenanceDomain.id, name: 'Line Maintenance', description: 'Daily checks, minor repairs' },
        { domainId: maintenanceDomain.id, name: 'Heavy Maintenance', description: 'C-checks, D-checks, major overhauls' },
        { domainId: maintenanceDomain.id, name: 'Parts & Inventory', description: 'Spare parts, rotables, consumables' },
        // Network
        { domainId: networkDomain.id, name: 'Schedule Planning', description: 'Season schedules, frequency planning' },
        { domainId: networkDomain.id, name: 'Fleet Assignment', description: 'Aircraft-to-route assignment' },
        { domainId: networkDomain.id, name: 'Route Profitability', description: 'P&L by route, network optimization' },
        // Finance
        { domainId: financeDomain.id, name: 'Revenue Accounting', description: 'Passenger revenue, proration, interline' },
        { domainId: financeDomain.id, name: 'Cost Accounting', description: 'Operating costs, unit costs, budgeting' },
        // Safety
        { domainId: safetyDomain.id, name: 'Safety Management', description: 'SMS, hazard reporting, safety analytics' },
        { domainId: safetyDomain.id, name: 'Regulatory Compliance', description: 'FAA/EASA compliance, audits, certificates' },
      ])
      .returning();

    // 3. Seed Agent Categories
    console.log('Seeding agent categories...');
    await db.insert(agentCategories).values([
      { code: 'BAG_IN', name: 'Baggage Intake', description: 'Initial bag acceptance and tagging', icon: '📥', color: '#10B981' },
      { code: 'TRACK', name: 'Real-Time Tracking', description: 'Live bag location monitoring', icon: '📍', color: '#3B82F6' },
      { code: 'RISK', name: 'Risk Assessment', description: 'Predictive analytics for mishandling', icon: '⚠️', color: '#F59E0B' },
      { code: 'EXCEPT', name: 'Exception Management', description: 'Handles mishandled and delayed bags', icon: '🚨', color: '#EF4444' },
      { code: 'L_AND_F', name: 'Lost & Found', description: 'Lost bag tracing and recovery', icon: '🔍', color: '#8B5CF6' },
      { code: 'COMP', name: 'Compensation', description: 'Passenger compensation and claims', icon: '💵', color: '#EC4899' },
      { code: 'CREW', name: 'Crew Management', description: 'Crew scheduling and pay', icon: '👨‍✈️', color: '#06B6D4' },
      { code: 'OPS', name: 'Operations Control', description: 'Flight ops coordination', icon: '🎯', color: '#8B5CF6' },
    ]);

    // 4. Seed MCPs with heavy focus on Baggage and Crew
    console.log('Seeding MCPs...');
    const [
      // Baggage MCPs (Copa use case)
      baggageIntelMCP,
      bagTrackingMCP,
      lostFoundMCP,
      // Crew MCPs (Avelo use case)
      crewPayMCP,
      crewSchedulingMCP,
      // Flight Planning
      flightPlanMCP,
      // Other domain MCPs
      dcsMCP,
      revMgmtMCP,
      distributionMCP,
      disruptionMCP,
      maintenanceMCP,
      networkMCP,
      cateringMCP,
      fuelingMCP,
      ancillaryMCP,
    ] = await db
      .insert(mcps)
      .values([
        // Baggage Handling (Copa use case) - Heavy focus
        {
          subdomainId: baggageSD.id,
          name: 'Baggage Intelligence MCP',
          description: 'AI-powered baggage tracking, risk prediction, and mishandling prevention',
          status: 'in-progress',
          targetQuarter: 'Q2-2025',
          owner: 'Copa Baggage Ops Team',
        },
        {
          subdomainId: baggageSD.id,
          name: 'Bag Tracking & Events MCP',
          description: 'Real-time bag location tracking and event processing',
          status: 'built',
          targetQuarter: 'Q1-2025',
          owner: 'Ground Ops',
        },
        {
          subdomainId: baggageSD.id,
          name: 'Lost & Found Intelligence MCP',
          description: 'Smart matching, recovery routing, passenger communication',
          status: 'planned',
          targetQuarter: 'Q3-2025',
          owner: 'Customer Service',
        },
        // Crew Operations (Avelo use case) - Heavy focus
        {
          subdomainId: crewOpsSD.id,
          name: 'Crew Pay Intelligence MCP',
          description: 'Automated pay validation, anomaly detection, override calculations',
          status: 'in-progress',
          targetQuarter: 'Q2-2025',
          owner: 'Avelo Crew Pay Team',
        },
        {
          subdomainId: crewOpsSD.id,
          name: 'Crew Scheduling & Optimization MCP',
          description: 'AI-driven crew pairing, bidding, and schedule optimization',
          status: 'planned',
          targetQuarter: 'Q4-2025',
          owner: 'Crew Operations',
        },
        // Flight Planning
        {
          subdomainId: flightPlanningSD.id,
          name: 'Flight Planning & Optimization MCP',
          description: 'Route optimization, fuel planning, weather analysis',
          status: 'built',
          targetQuarter: 'Q1-2025',
          owner: 'Flight Ops',
        },
        // Customer Service
        {
          subdomainId: checkinSD.id,
          name: 'DCS Intelligence MCP',
          description: 'Smart check-in, upgrade recommendations, ancillary offers',
          status: 'built',
          targetQuarter: 'Q1-2025',
          owner: 'Customer Service',
        },
        {
          subdomainId: disruptionMgmtSD.id,
          name: 'Disruption Management MCP',
          description: 'Automated rebooking, compensation, recovery planning',
          status: 'in-progress',
          targetQuarter: 'Q2-2025',
          owner: 'Customer Service',
        },
        // Commercial
        {
          subdomainId: revMgmtSD.id,
          name: 'Revenue Management AI MCP',
          description: 'Dynamic pricing, demand forecasting, inventory optimization',
          status: 'in-progress',
          targetQuarter: 'Q3-2025',
          owner: 'Revenue Management',
        },
        {
          subdomainId: distributionSD.id,
          name: 'Distribution Intelligence MCP',
          description: 'Channel optimization, NDC conversion, cost reduction',
          status: 'planned',
          targetQuarter: 'Q4-2025',
          owner: 'Commercial',
        },
        {
          subdomainId: ancillarySD.id,
          name: 'Ancillary Recommendation MCP',
          description: 'Personalized upsell, bundle optimization',
          status: 'planned',
          targetQuarter: 'Q3-2025',
          owner: 'Commercial',
        },
        // Maintenance
        {
          subdomainId: lineMaintenanceSD.id,
          name: 'Predictive Maintenance MCP',
          description: 'Aircraft health monitoring, failure prediction',
          status: 'planned',
          targetQuarter: 'Q4-2025',
          owner: 'Engineering',
        },
        // Network
        {
          subdomainId: schedulePlanningSD.id,
          name: 'Network Optimization MCP',
          description: 'Schedule optimization, frequency planning, slot management',
          status: 'planned',
          targetQuarter: 'Q4-2025',
          owner: 'Network Planning',
        },
        // Other Ground Ops
        {
          subdomainId: cateringSD.id,
          name: 'Catering Optimization MCP',
          description: 'Meal planning, uplift optimization, waste reduction',
          status: 'planned',
          targetQuarter: 'Q3-2025',
          owner: 'Ground Ops',
        },
        {
          subdomainId: fuelingSD.id,
          name: 'Fuel Management MCP',
          description: 'Fuel cost optimization, tankering analysis',
          status: 'planned',
          targetQuarter: 'Q3-2025',
          owner: 'Ground Ops',
        },
      ])
      .returning();

    // 5. Seed Tools - Heavy focus on Baggage and Crew
    console.log('Seeding tools...');
    await db.insert(tools).values([
      // Baggage Intelligence MCP tools (Copa use case)
      { mcpId: baggageIntelMCP.id, name: 'track_bag_location', description: 'Get real-time bag location by tag number', status: 'built' },
      { mcpId: baggageIntelMCP.id, name: 'predict_mishandling_risk', description: 'Calculate risk score for bag mishandling based on connection, station, history', status: 'built' },
      { mcpId: baggageIntelMCP.id, name: 'analyze_connection_times', description: 'Analyze minimum connection times for baggage transfers', status: 'built' },
      { mcpId: baggageIntelMCP.id, name: 'generate_bag_alerts', description: 'Create proactive alerts for at-risk bags', status: 'built' },
      { mcpId: baggageIntelMCP.id, name: 'reconcile_bags', description: 'Match loaded bags against manifest', status: 'in-progress' },
      { mcpId: baggageIntelMCP.id, name: 'route_mishandled_bag', description: 'Find optimal routing for mishandled bags', status: 'in-progress' },
      { mcpId: baggageIntelMCP.id, name: 'calculate_baggage_roi', description: 'Calculate ROI of baggage investments and improvements', status: 'built' },
      { mcpId: baggageIntelMCP.id, name: 'get_station_performance', description: 'Get baggage performance metrics by station', status: 'planned' },

      // Bag Tracking MCP tools
      { mcpId: bagTrackingMCP.id, name: 'scan_bag_event', description: 'Record bag scan event (check-in, loading, transfer, claim)', status: 'built' },
      { mcpId: bagTrackingMCP.id, name: 'get_bag_history', description: 'Retrieve complete journey history for a bag', status: 'built' },
      { mcpId: bagTrackingMCP.id, name: 'find_bags_by_flight', description: 'List all bags for a specific flight', status: 'built' },
      { mcpId: bagTrackingMCP.id, name: 'detect_missing_scans', description: 'Identify bags missing expected scan events', status: 'built' },

      // Lost & Found MCP tools
      { mcpId: lostFoundMCP.id, name: 'match_lost_bag', description: 'Match lost bag description to found bags', status: 'planned' },
      { mcpId: lostFoundMCP.id, name: 'trace_mishandled_bag', description: 'Trace current location of mishandled bag', status: 'planned' },
      { mcpId: lostFoundMCP.id, name: 'calculate_delivery_route', description: 'Find optimal delivery route for recovered bags', status: 'planned' },
      { mcpId: lostFoundMCP.id, name: 'notify_passenger', description: 'Send bag status notifications via SMS/email', status: 'planned' },
      { mcpId: lostFoundMCP.id, name: 'generate_bag_claim_form', description: 'Create PIR (Property Irregularity Report)', status: 'planned' },

      // Crew Pay Intelligence MCP tools (Avelo use case)
      { mcpId: crewPayMCP.id, name: 'validate_pay_claim', description: 'Validate crew member pay claim against flight records', status: 'built' },
      { mcpId: crewPayMCP.id, name: 'detect_pay_anomalies', description: 'Detect unusual patterns in pay claims (duplicates, over-claims)', status: 'built' },
      { mcpId: crewPayMCP.id, name: 'calculate_override_pay', description: 'Calculate pay for duty overrides and extensions', status: 'in-progress' },
      { mcpId: crewPayMCP.id, name: 'generate_pay_report', description: 'Generate detailed pay breakdown by crew member', status: 'planned' },
      { mcpId: crewPayMCP.id, name: 'reconcile_duty_time', description: 'Reconcile actual vs scheduled duty time', status: 'planned' },
      { mcpId: crewPayMCP.id, name: 'calculate_per_diem', description: 'Calculate per diem based on trip routing', status: 'in-progress' },

      // Crew Scheduling MCP tools
      { mcpId: crewSchedulingMCP.id, name: 'optimize_crew_pairing', description: 'Create optimal crew pairings for flight schedule', status: 'planned' },
      { mcpId: crewSchedulingMCP.id, name: 'check_legality', description: 'Verify crew schedule meets FAA/EASA regulations', status: 'planned' },
      { mcpId: crewSchedulingMCP.id, name: 'assign_reserves', description: 'Assign reserve crew for open positions', status: 'planned' },
      { mcpId: crewSchedulingMCP.id, name: 'process_crew_bid', description: 'Process crew bidding for monthly schedules', status: 'planned' },

      // Flight Planning MCP tools
      { mcpId: flightPlanMCP.id, name: 'calculate_fuel_requirement', description: 'Calculate fuel needed for route with reserves', status: 'built' },
      { mcpId: flightPlanMCP.id, name: 'optimize_flight_route', description: 'Find most efficient route considering winds', status: 'built' },
      { mcpId: flightPlanMCP.id, name: 'analyze_weather_impact', description: 'Assess weather impact on flight plan', status: 'built' },
      { mcpId: flightPlanMCP.id, name: 'calculate_alternate_airports', description: 'Select suitable alternate/diversion airports', status: 'built' },

      // DCS Intelligence MCP tools
      { mcpId: dcsMCP.id, name: 'check_in_passenger', description: 'Process passenger check-in and seat assignment', status: 'built' },
      { mcpId: dcsMCP.id, name: 'recommend_upgrades', description: 'Offer personalized upgrade recommendations', status: 'built' },
      { mcpId: dcsMCP.id, name: 'optimize_seat_assignment', description: 'Auto-assign seats to maximize revenue and satisfaction', status: 'built' },
      { mcpId: dcsMCP.id, name: 'manage_standby_list', description: 'Prioritize and clear standby passengers', status: 'built' },

      // Disruption Management MCP tools
      { mcpId: disruptionMCP.id, name: 'find_rebooking_options', description: 'Search alternative flights for disrupted passengers', status: 'in-progress' },
      { mcpId: disruptionMCP.id, name: 'calculate_compensation', description: 'Calculate passenger compensation per EU261/DOT rules', status: 'in-progress' },
      { mcpId: disruptionMCP.id, name: 'auto_rebook_passenger', description: 'Automatically rebook passenger on best available option', status: 'in-progress' },
      { mcpId: disruptionMCP.id, name: 'arrange_hotel_voucher', description: 'Book hotel for overnight delays', status: 'planned' },

      // Revenue Management MCP tools
      { mcpId: revMgmtMCP.id, name: 'forecast_demand', description: 'Forecast demand by flight and booking class', status: 'in-progress' },
      { mcpId: revMgmtMCP.id, name: 'optimize_pricing', description: 'Calculate optimal pricing for each flight', status: 'in-progress' },
      { mcpId: revMgmtMCP.id, name: 'manage_inventory', description: 'Adjust seat inventory availability by class', status: 'in-progress' },
      { mcpId: revMgmtMCP.id, name: 'analyze_competitor_fares', description: 'Monitor and analyze competitor pricing', status: 'planned' },

      // Distribution MCP tools
      { mcpId: distributionMCP.id, name: 'optimize_channel_mix', description: 'Optimize distribution across GDS, direct, OTA', status: 'planned' },
      { mcpId: distributionMCP.id, name: 'calculate_channel_cost', description: 'Calculate true cost per booking by channel', status: 'planned' },
      { mcpId: distributionMCP.id, name: 'promote_ndc', description: 'Incentivize NDC bookings vs GDS', status: 'planned' },

      // Predictive Maintenance MCP tools
      { mcpId: maintenanceMCP.id, name: 'predict_component_failure', description: 'Predict when aircraft components will fail', status: 'planned' },
      { mcpId: maintenanceMCP.id, name: 'optimize_mx_schedule', description: 'Schedule maintenance to minimize disruption', status: 'planned' },
      { mcpId: maintenanceMCP.id, name: 'manage_aog_parts', description: 'Prioritize parts for AOG situations', status: 'planned' },

      // Network Optimization MCP tools
      { mcpId: networkMCP.id, name: 'analyze_route_performance', description: 'Analyze profitability and load factor by route', status: 'planned' },
      { mcpId: networkMCP.id, name: 'optimize_frequencies', description: 'Determine optimal flight frequencies', status: 'planned' },
      { mcpId: networkMCP.id, name: 'assign_aircraft_type', description: 'Match aircraft type to route demand', status: 'planned' },
    ]);

    // 6. Seed Agents - 18+ agents distributed across categories
    console.log('Seeding agents...');
    const [
      // Baggage agents
      bagIntakeAgent,
      bagTrackerAgent,
      bagRiskAgent,
      bagExceptionAgent,
      lostFoundAgent,
      bagCompAgent,
      // Crew agents
      crewPayAgent,
      crewSchedulerAgent,
      crewLegalityAgent,
      // Operations agents
      flightPlanAgent,
      dispatchAgent,
      opsControlAgent,
      // Customer service agents
      checkinAgent,
      disruptionAgent,
      compensationAgent,
      // Commercial agents
      revMgmtAgent,
      ancillaryAgent,
      // Maintenance agent
      mxPredictiveAgent,
    ] = await db
      .insert(agents)
      .values([
        // Baggage Handling Agents (Copa use case)
        {
          code: 'BAG_INTAKE_001',
          name: 'Baggage Intake Agent',
          categoryCode: 'BAG_IN',
          description: 'Handles bag acceptance, tagging, and initial risk assessment at check-in',
          autonomyLevel: 3,
          mcpId: bagTrackingMCP.id,
          active: true,
          metadata: { capabilities: ['tag_generation', 'weight_check', 'hazmat_screening'], maxConcurrentBags: 50 },
        },
        {
          code: 'BAG_TRACKER_001',
          name: 'Real-Time Bag Tracker',
          categoryCode: 'TRACK',
          description: 'Monitors bag location in real-time, processes scan events, maintains status',
          autonomyLevel: 4,
          mcpId: bagTrackingMCP.id,
          active: true,
          metadata: { trackingInterval: '30s', alertThreshold: 90 },
        },
        {
          code: 'BAG_RISK_001',
          name: 'Mishandling Risk Predictor',
          categoryCode: 'RISK',
          description: 'Predicts bags at risk of mishandling using ML models, suggests interventions',
          autonomyLevel: 5,
          mcpId: baggageIntelMCP.id,
          active: true,
          metadata: { modelVersion: '2.1', riskThreshold: 0.75, predictionWindow: '2h' },
        },
        {
          code: 'BAG_EXCEPTION_001',
          name: 'Bag Exception Handler',
          categoryCode: 'EXCEPT',
          description: 'Handles mishandled, delayed, and damaged bags, routes to recovery',
          autonomyLevel: 4,
          mcpId: baggageIntelMCP.id,
          active: true,
          metadata: { maxSimultaneous: 20, autoRouteEnabled: true },
        },
        {
          code: 'LOST_FOUND_001',
          name: 'Lost & Found Specialist',
          categoryCode: 'L_AND_F',
          description: 'Traces lost bags, matches found items, coordinates delivery',
          autonomyLevel: 3,
          mcpId: lostFoundMCP.id,
          active: false,
          metadata: { matchingAlgorithm: 'fuzzy', deliveryRadius: '50mi' },
        },
        {
          code: 'BAG_COMP_001',
          name: 'Baggage Compensation Agent',
          categoryCode: 'COMP',
          description: 'Calculates compensation for delayed/lost bags per Montreal Convention',
          autonomyLevel: 4,
          mcpId: lostFoundMCP.id,
          active: false,
          metadata: { maxAutoApproval: 1500, currency: 'USD' },
        },

        // Crew Operations Agents (Avelo use case)
        {
          code: 'CREW_PAY_001',
          name: 'Crew Pay Validator',
          categoryCode: 'CREW',
          description: 'Validates crew pay claims, detects anomalies, calculates overrides',
          autonomyLevel: 5,
          mcpId: crewPayMCP.id,
          active: true,
          metadata: { validationRules: ['duty_time', 'pairing', 'overrides'], autoApproveLimit: 5000 },
        },
        {
          code: 'CREW_SCHED_001',
          name: 'Crew Scheduler Optimizer',
          categoryCode: 'CREW',
          description: 'Creates optimal crew pairings, manages bidding, assigns reserves',
          autonomyLevel: 4,
          mcpId: crewSchedulingMCP.id,
          active: false,
          metadata: { optimizationGoal: 'cost_quality_balance', lookAheadDays: 90 },
        },
        {
          code: 'CREW_LEGAL_001',
          name: 'Crew Legality Checker',
          categoryCode: 'CREW',
          description: 'Ensures crew schedules comply with FAA/EASA duty time regulations',
          autonomyLevel: 5,
          mcpId: crewSchedulingMCP.id,
          active: false,
          metadata: { regulations: ['FAA117', 'EASA_FTL'], alertOnViolation: true },
        },

        // Flight Operations Agents
        {
          code: 'FLIGHT_PLAN_001',
          name: 'Flight Planning Agent',
          categoryCode: 'OPS',
          description: 'Creates optimal flight plans considering weather, fuel, and routing',
          autonomyLevel: 4,
          mcpId: flightPlanMCP.id,
          active: true,
          metadata: { fuelOptimization: true, weatherSources: ['NOAA', 'MeteoBlue'] },
        },
        {
          code: 'DISPATCH_001',
          name: 'Flight Dispatcher',
          categoryCode: 'OPS',
          description: 'Monitors flights in progress, coordinates with crew, handles irregularities',
          autonomyLevel: 5,
          mcpId: flightPlanMCP.id,
          active: true,
          metadata: { maxFlightsConcurrent: 25, alerting: 'proactive' },
        },
        {
          code: 'OCC_CONTROL_001',
          name: 'Operations Control Coordinator',
          categoryCode: 'OPS',
          description: 'Orchestrates across flight ops, crew, maintenance, ground ops',
          autonomyLevel: 5,
          mcpId: flightPlanMCP.id,
          active: true,
          metadata: { systemIntegration: ['flight_ops', 'crew', 'mx', 'ground'], decisionAuthority: 'high' },
        },

        // Customer Service Agents
        {
          code: 'CHECKIN_AGENT_001',
          name: 'Smart Check-in Agent',
          categoryCode: 'OPS',
          description: 'Automates check-in, suggests upgrades, optimizes seat assignments',
          autonomyLevel: 4,
          mcpId: dcsMCP.id,
          active: true,
          metadata: { autoSeatAssign: true, upgradeOffers: true },
        },
        {
          code: 'DISRUPTION_001',
          name: 'Disruption Recovery Agent',
          categoryCode: 'OPS',
          description: 'Automatically rebooks passengers during disruptions, arranges hotels',
          autonomyLevel: 4,
          mcpId: disruptionMCP.id,
          active: true,
          metadata: { autoRebookThreshold: 'all_delays_2h+', hotelBudget: 150 },
        },
        {
          code: 'COMPENSATION_001',
          name: 'Passenger Compensation Agent',
          categoryCode: 'COMP',
          description: 'Calculates and processes passenger compensation per regulations',
          autonomyLevel: 4,
          mcpId: disruptionMCP.id,
          active: true,
          metadata: { regulations: ['EU261', 'DOT'], autoPayLimit: 600 },
        },

        // Commercial Agents
        {
          code: 'REV_MGMT_001',
          name: 'Revenue Optimization Agent',
          categoryCode: 'OPS',
          description: 'Optimizes pricing and inventory across the network',
          autonomyLevel: 5,
          mcpId: revMgmtMCP.id,
          active: true,
          metadata: { reoptimizationFrequency: '1h', priceFloors: true },
        },
        {
          code: 'ANCILLARY_001',
          name: 'Ancillary Upsell Agent',
          categoryCode: 'OPS',
          description: 'Recommends personalized ancillary products to maximize revenue',
          autonomyLevel: 3,
          mcpId: ancillaryMCP.id,
          active: false,
          metadata: { personalization: 'ml_based', products: ['seats', 'bags', 'meals', 'upgrades'] },
        },

        // Maintenance Agent
        {
          code: 'MX_PREDICT_001',
          name: 'Predictive Maintenance Agent',
          categoryCode: 'OPS',
          description: 'Predicts component failures, optimizes maintenance scheduling',
          autonomyLevel: 4,
          mcpId: maintenanceMCP.id,
          active: false,
          metadata: { predictionHorizon: '30d', confidenceThreshold: 0.8 },
        },
      ])
      .returning();

    // 7. Seed Workflows
    console.log('Seeding workflows...');
    const [
      baggageWorkflow,
      crewPayWorkflow,
      disruptionWorkflow,
      revOptWorkflow,
    ] = await db
      .insert(workflows)
      .values([
        {
          subdomainId: baggageSD.id,
          name: 'Proactive Baggage Mishandling Prevention',
          description: 'Predict and prevent bag mishandling before it occurs using real-time risk scoring',
          complexity: 5,
          agenticPotential: 5,
          implementationWave: 1,
          status: 'in-progress',
          expectedRoi: '30% reduction in mishandled bags, $2M annual savings',
          successMetrics: { mishandlingReduction: 30, customerSatisfactionIncrease: 20, costSavings: 2000000 },
        },
        {
          subdomainId: crewOpsSD.id,
          name: 'Automated Crew Pay Validation',
          description: 'Automatically validate crew pay claims, detect anomalies, calculate overrides',
          complexity: 4,
          agenticPotential: 5,
          implementationWave: 1,
          status: 'in-progress',
          expectedRoi: '90% reduction in manual validation time, 95% error detection',
          successMetrics: { manualTimeReduction: 90, errorDetectionRate: 95, payrollAccuracy: 99.5 },
        },
        {
          subdomainId: disruptionMgmtSD.id,
          name: 'Intelligent Disruption Recovery',
          description: 'Automatically rebook passengers, arrange hotels, process compensation during IRROPs',
          complexity: 5,
          agenticPotential: 4,
          implementationWave: 2,
          status: 'planned',
          expectedRoi: '60% faster rebooking, 25% higher customer satisfaction',
          successMetrics: { rebookingSpeed: 60, customerSatisfaction: 25, agentTimeReduction: 50 },
        },
        {
          subdomainId: revMgmtSD.id,
          name: 'Dynamic Revenue Optimization',
          description: 'Continuously optimize pricing and inventory based on demand signals',
          complexity: 5,
          agenticPotential: 5,
          implementationWave: 2,
          status: 'planned',
          expectedRoi: '3-5% revenue increase, improved load factors',
          successMetrics: { revenueIncrease: 4, loadFactorImprovement: 2.5 },
        },
      ])
      .returning();

    // 8. Seed Workflow-MCP associations
    console.log('Seeding workflow-MCP associations...');
    await db.insert(workflowMcps).values([
      { workflowId: baggageWorkflow.id, mcpId: baggageIntelMCP.id },
      { workflowId: baggageWorkflow.id, mcpId: bagTrackingMCP.id },
      { workflowId: crewPayWorkflow.id, mcpId: crewPayMCP.id },
      { workflowId: disruptionWorkflow.id, mcpId: disruptionMCP.id },
      { workflowId: disruptionWorkflow.id, mcpId: dcsMCP.id },
      { workflowId: revOptWorkflow.id, mcpId: revMgmtMCP.id },
    ]);

    // 9. Seed Workflow-Agent associations
    console.log('Seeding workflow-agent associations...');
    await db.insert(workflowAgents).values([
      { workflowId: baggageWorkflow.id, agentId: bagRiskAgent.id, role: 'Risk Predictor' },
      { workflowId: baggageWorkflow.id, agentId: bagTrackerAgent.id, role: 'Real-time Tracker' },
      { workflowId: baggageWorkflow.id, agentId: bagExceptionAgent.id, role: 'Exception Handler' },
      { workflowId: crewPayWorkflow.id, agentId: crewPayAgent.id, role: 'Pay Validator' },
      { workflowId: disruptionWorkflow.id, agentId: disruptionAgent.id, role: 'Rebooking Coordinator' },
      { workflowId: disruptionWorkflow.id, agentId: compensationAgent.id, role: 'Compensation Processor' },
      { workflowId: revOptWorkflow.id, agentId: revMgmtAgent.id, role: 'Revenue Optimizer' },
    ]);

    // 10. Seed Agent Collaborations
    console.log('Seeding agent collaborations...');
    await db.insert(agentCollaborations).values([
      // Baggage workflow collaborations
      { sourceAgentId: bagRiskAgent.id, targetAgentId: bagTrackerAgent.id, collaborationType: 'data_feed', strength: 5, bidirectional: false },
      { sourceAgentId: bagTrackerAgent.id, targetAgentId: bagExceptionAgent.id, collaborationType: 'alert_trigger', strength: 5, bidirectional: false },
      { sourceAgentId: bagExceptionAgent.id, targetAgentId: lostFoundAgent.id, collaborationType: 'handoff', strength: 4, bidirectional: false },
      { sourceAgentId: lostFoundAgent.id, targetAgentId: bagCompAgent.id, collaborationType: 'compensation_trigger', strength: 4, bidirectional: false },
      // Crew collaborations
      { sourceAgentId: crewSchedulerAgent.id, targetAgentId: crewLegalityAgent.id, collaborationType: 'validation', strength: 5, bidirectional: false },
      { sourceAgentId: crewPayAgent.id, targetAgentId: crewSchedulerAgent.id, collaborationType: 'data_query', strength: 4, bidirectional: false },
      // Cross-functional collaborations
      { sourceAgentId: dispatchAgent.id, targetAgentId: crewSchedulerAgent.id, collaborationType: 'crew_availability', strength: 5, bidirectional: true },
      { sourceAgentId: disruptionAgent.id, targetAgentId: bagExceptionAgent.id, collaborationType: 'passenger_bag_coordination', strength: 4, bidirectional: true },
      { sourceAgentId: mxPredictiveAgent.id, targetAgentId: dispatchAgent.id, collaborationType: 'aircraft_status', strength: 5, bidirectional: false },
    ]);

    // 11. Seed Cross-Domain Bridges
    console.log('Seeding cross-domain bridges...');
    await db.insert(crossDomainBridges).values([
      {
        sourceSubdomainId: baggageSD.id,
        targetSubdomainId: disruptionMgmtSD.id,
        bridgeType: 'data_flow',
        name: 'Baggage Status → Passenger Rebooking',
        description: 'Delayed bag information triggers proactive passenger rebooking and notifications',
        strength: 5,
      },
      {
        sourceSubdomainId: crewOpsSD.id,
        targetSubdomainId: dispatchSD.id,
        bridgeType: 'dependency',
        name: 'Crew Availability → Flight Dispatch',
        description: 'Crew availability and legality checks are required before flight dispatch',
        strength: 5,
      },
      {
        sourceSubdomainId: lineMaintenanceSD.id,
        targetSubdomainId: schedulePlanningSD.id,
        bridgeType: 'dependency',
        name: 'Aircraft Availability → Schedule Planning',
        description: 'Maintenance schedules constrain aircraft availability for flight scheduling',
        strength: 5,
      },
      {
        sourceSubdomainId: routeProfitabilitySD.id,
        targetSubdomainId: schedulePlanningSD.id,
        bridgeType: 'data_flow',
        name: 'Route P&L → Network Planning',
        description: 'Route profitability analysis feeds network planning decisions',
        strength: 4,
      },
      {
        sourceSubdomainId: baggageSD.id,
        targetSubdomainId: cargoSD.id,
        bridgeType: 'shared_resource',
        name: 'Baggage ↔ Cargo Hold Sharing',
        description: 'Baggage and cargo compete for limited cargo hold space',
        strength: 4,
      },
      {
        sourceSubdomainId: checkinSD.id,
        targetSubdomainId: baggageSD.id,
        bridgeType: 'process_handoff',
        name: 'Check-in → Bag Tagging',
        description: 'Passenger check-in triggers bag acceptance and tagging workflow',
        strength: 5,
      },
      {
        sourceSubdomainId: revMgmtSD.id,
        targetSubdomainId: distributionSD.id,
        bridgeType: 'data_flow',
        name: 'Pricing → Distribution',
        description: 'Revenue management pricing feeds into distribution channels',
        strength: 5,
      },
    ]);

    // 12. Seed MCP Dependencies
    console.log('Seeding MCP dependencies...');
    await db.insert(mcpDependencies).values([
      {
        sourceMcpId: crewSchedulingMCP.id,
        targetMcpId: flightPlanMCP.id,
        dependencyType: 'requires',
        description: 'Crew scheduling requires flight schedule data to create optimal pairings',
      },
      {
        sourceMcpId: baggageIntelMCP.id,
        targetMcpId: dcsMCP.id,
        dependencyType: 'feeds_data',
        description: 'Baggage intelligence uses passenger check-in data for risk prediction',
      },
      {
        sourceMcpId: disruptionMCP.id,
        targetMcpId: baggageIntelMCP.id,
        dependencyType: 'feeds_data',
        description: 'Disruption management uses bag status to coordinate passenger-bag rebooking',
      },
      {
        sourceMcpId: distributionMCP.id,
        targetMcpId: revMgmtMCP.id,
        dependencyType: 'requires',
        description: 'Distribution channels require pricing data from revenue management',
      },
      {
        sourceMcpId: ancillaryMCP.id,
        targetMcpId: dcsMCP.id,
        dependencyType: 'enhances',
        description: 'Ancillary recommendations enhance check-in experience with upsell offers',
      },
      {
        sourceMcpId: crewPayMCP.id,
        targetMcpId: crewSchedulingMCP.id,
        dependencyType: 'requires',
        description: 'Crew pay validation requires actual crew pairings and duty assignments',
      },
    ]);

    console.log('Comprehensive airline operations seed completed successfully!');
    console.log('---');
    console.log('Summary:');
    console.log('- 8 Domains');
    console.log('- 25 Subdomains');
    console.log('- 15 MCPs (heavy focus on Baggage & Crew)');
    console.log('- 60+ Tools');
    console.log('- 8 Agent Categories');
    console.log('- 18 Agents');
    console.log('- 4 Workflows');
    console.log('- 7 Cross-Domain Bridges');
    console.log('- 6 MCP Dependencies');
  } catch (error) {
    console.error('Error during seed:', error);
    throw error;
  }
}

// Run seed
seed()
  .then(() => {
    console.log('✅ Database seeded successfully with comprehensive airline operations data');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
