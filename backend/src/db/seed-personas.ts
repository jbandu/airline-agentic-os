import { db } from './index';
import { personas, useCases, useCaseSteps } from './schema';

async function seedPersonasAndUseCases() {
  console.log('🌱 Seeding Copa Airlines personas and use cases...');

  try {
    // Find subdomain IDs
    const checkInSubdomain = await db.query.subdomains.findFirst({
      where: (subdomains, { eq }) => eq(subdomains.name, 'Check-in & DCS'),
    });

    const dispatchSubdomain = await db.query.subdomains.findFirst({
      where: (subdomains, { eq }) => eq(subdomains.name, 'Dispatch & OCC'),
    });

    const rampSubdomain = await db.query.subdomains.findFirst({
      where: (subdomains, { eq }) => eq(subdomains.name, 'Ramp Operations'),
    });

    if (!checkInSubdomain || !dispatchSubdomain || !rampSubdomain) {
      throw new Error('Required subdomains not found. Please ensure base data is seeded first.');
    }

    // 1. GATE AGENT PERSONA
    console.log('  Creating Gate Agent persona...');
    const [gateAgent] = await db.insert(personas).values({
      subdomainId: checkInSubdomain.id,
      code: 'GA-001',
      name: 'Gate Agent',
      fullTitle: 'Customer Service Agent - Gate Operations',
      description: 'Frontline agent responsible for passenger check-in, boarding, and gate operations at Copa Airlines hubs',
      responsibilities: [
        'Check-in passengers and issue boarding passes',
        'Process seat assignments and upgrades',
        'Manage boarding process and announcements',
        'Handle gate changes and flight delays',
        'Resolve passenger issues and special requests',
        'Coordinate with operations and crew',
        'Ensure regulatory compliance (passports, visas)',
        'Manage standby and oversale situations',
      ],
      typicalExperience: '1-3 years in airline customer service',
      reportsTo: 'Station Manager',
      teamSizeRange: '8-12 agents per shift',
      shiftPatterns: ['Morning (05:00-13:00)', 'Afternoon (13:00-21:00)', 'Night (21:00-05:00)'],
      systemsUsed: ['Departure Control System (DCS)', 'Check-in kiosks', 'Gate readers', 'IROP tools', 'ConnectMiles'],
      painPoints: [
        'System crashes during peak hours causing long queues',
        'Lack of real-time information about delays and gate changes',
        'Manual seat assignment process is time-consuming',
        'Difficulty finding alternative flights during disruptions',
        'Inconsistent passenger documentation verification',
        'Limited authority to resolve complex issues quickly',
      ],
      goals: [
        'Minimize passenger wait times and improve satisfaction scores',
        'Reduce boarding time to meet on-time departure targets',
        'Handle 100+ passengers per flight efficiently',
        'Maintain compliance with security and regulatory requirements',
        'Reduce escalations to supervisors',
      ],
      airlineTypes: ['full_service', 'hub_carrier'],
      icon: '👔',
      sortOrder: 10,
    }).returning();

    // Gate Agent Use Case 1: Express Check-In Processing
    console.log('  Creating Gate Agent use cases...');
    const [expressCheckIn] = await db.insert(useCases).values({
      personaId: gateAgent.id,
      code: 'GA-UC-001',
      name: 'Express Check-In for Frequent Flyers',
      description: 'Fast-track check-in and boarding pass issuance for ConnectMiles elite members',
      detailedNarrative: 'Elite ConnectMiles members approach the gate agent desk for priority check-in. The agent must verify status, assign preferred seats, process any upgrades, issue boarding passes, and tag bags - all while providing personalized service. Currently involves multiple system lookups and manual steps.',
      frequency: 'multiple_daily',
      typicalDurationMinutes: 12,
      timePressure: 'urgent',
      peakTimes: ['06:00-09:00', '16:00-19:00'],
      triggers: ['Passenger approaches desk', 'Flight opens for check-in'],
      preconditions: ['Flight is open for check-in', 'Passenger has valid booking'],
      postconditions: ['Boarding pass issued', 'Seat assigned', 'Bags tagged'],
      complexity: 3,
      automationPotential: 4,
      currentPainLevel: 4,
      businessImpact: 'high',
      estimatedAnnualOccurrences: 45000, // ~125 per day across Copa network
      estimatedCostPerOccurrence: 850, // $8.50 in cents
      currentProcess: 'Manual check-in with multiple system queries, manual seat selection, manual upgrade processing, physical boarding pass printing',
      currentToolsUsed: ['DCS Manual', 'ConnectMiles System', 'Seat Map Tool', 'Upgrade Queue'],
      currentTimeMinutes: 12,
      currentSuccessRate: 78,
      proposedProcess: 'AI agent pre-validates elite status, auto-assigns best available seats, processes upgrades instantly, sends digital boarding pass to mobile app',
      proposedTimeMinutes: 3,
      proposedSuccessRate: 96,
      category: 'operational',
      priority: 5,
      implementationWave: 1,
      status: 'analyzed',
      kpis: {
        'check_in_time': 'Average time from start to boarding pass issuance',
        'elite_satisfaction': 'CSAT score for elite members',
        'queue_length': 'Average queue time during peak hours',
      },
    }).returning();

    // Steps for Express Check-In
    await db.insert(useCaseSteps).values([
      {
        useCaseId: expressCheckIn.id,
        stepNumber: 1,
        name: 'Greet Passenger and Verify Status',
        description: 'Welcome passenger, check ID, look up ConnectMiles elite status',
        actor: 'human',
        actionType: 'data_lookup',
        currentDurationSeconds: 90,
        targetDurationSeconds: 15,
        canAutomate: true,
        automationNotes: 'AI can auto-recognize elite members via mobile app or facial recognition',
        errorProne: false,
        systemsInvolved: ['DCS', 'ConnectMiles'],
        dataNeeded: ['Passenger ID', 'Booking reference'],
        dataProduced: ['Elite status confirmation'],
      },
      {
        useCaseId: expressCheckIn.id,
        stepNumber: 2,
        name: 'Check Upgrade Eligibility',
        description: 'Review upgrade queue, check available premium seats, process upgrade if eligible',
        actor: 'human',
        actionType: 'decision',
        currentDurationSeconds: 180,
        targetDurationSeconds: 5,
        canAutomate: true,
        automationNotes: 'AI agent can instantly evaluate upgrade rules and process automatically',
        errorProne: true,
        errorNotes: 'Manual upgrade rules are complex and often misapplied',
        systemsInvolved: ['DCS', 'Upgrade Queue System'],
        dataNeeded: ['Elite tier', 'Upgrade instruments', 'Cabin availability'],
        dataProduced: ['Upgrade decision', 'New seat assignment'],
        decisionCriteria: 'Elite tier priority + upgrade instruments available + seat availability',
      },
      {
        useCaseId: expressCheckIn.id,
        stepNumber: 3,
        name: 'Assign Preferred Seat',
        description: 'Select best available seat based on passenger preferences (aisle/window, front of cabin)',
        actor: 'human',
        actionType: 'data_entry',
        currentDurationSeconds: 120,
        targetDurationSeconds: 5,
        canAutomate: true,
        automationNotes: 'AI can learn passenger preferences and auto-assign optimal seats',
        errorProne: false,
        systemsInvolved: ['DCS Seat Map'],
        dataNeeded: ['Seat preferences', 'Available seats'],
        dataProduced: ['Seat assignment'],
      },
      {
        useCaseId: expressCheckIn.id,
        stepNumber: 4,
        name: 'Issue Boarding Pass',
        description: 'Generate and print boarding pass, explain boarding time and gate',
        actor: 'human',
        actionType: 'notification',
        currentDurationSeconds: 90,
        targetDurationSeconds: 15,
        canAutomate: true,
        automationNotes: 'Digital boarding pass sent to mobile app automatically',
        errorProne: false,
        systemsInvolved: ['DCS', 'Gate Printer'],
        dataProduced: ['Boarding pass'],
      },
      {
        useCaseId: expressCheckIn.id,
        stepNumber: 5,
        name: 'Process Baggage',
        description: 'Tag checked bags, verify weight, provide baggage claim info',
        actor: 'human',
        actionType: 'data_entry',
        currentDurationSeconds: 240,
        targetDurationSeconds: 90,
        canAutomate: false,
        automationNotes: 'Physical baggage handling required, but tagging can be automated',
        errorProne: true,
        errorNotes: 'Bags sometimes mis-tagged to wrong destination',
        systemsInvolved: ['DCS', 'Bag Tag Printer'],
        dataNeeded: ['Bag count', 'Weight', 'Final destination'],
        dataProduced: ['Bag tags', 'Baggage receipt'],
      },
    ]);

    // Gate Agent Use Case 2: Irregular Operations (IROP) Rebooking
    const [iropRebooking] = await db.insert(useCases).values({
      personaId: gateAgent.id,
      code: 'GA-UC-002',
      name: 'Flight Delay Passenger Rebooking',
      description: 'Rebook passengers on alternative flights when their original flight is delayed or cancelled',
      detailedNarrative: 'When Copa flight is delayed/cancelled, gate agents must quickly find alternative routing for affected passengers, prioritizing connections and elite status. Currently a manual, time-consuming process with inconsistent results.',
      frequency: 'daily',
      typicalDurationMinutes: 25,
      timePressure: 'immediate',
      peakTimes: ['Weather delays', 'Mechanical issues'],
      triggers: ['Flight delay >2 hours', 'Flight cancellation', 'Misconnection risk'],
      preconditions: ['Flight is delayed/cancelled', 'Passenger has valid booking'],
      postconditions: ['Passenger rebooked', 'New boarding pass issued', 'Meal vouchers processed'],
      complexity: 5,
      automationPotential: 5,
      currentPainLevel: 5,
      businessImpact: 'critical',
      estimatedAnnualOccurrences: 8500, // ~23 per day across network
      estimatedCostPerOccurrence: 4200, // $42 in cents
      currentProcess: 'Manual search for alternative flights, phone calls to check seat availability, manual PNR modifications, voucher printing',
      currentToolsUsed: ['DCS', 'Schedule Display', 'Reservations System', 'Voucher System'],
      currentTimeMinutes: 25,
      currentSuccessRate: 65,
      proposedProcess: 'AI agent instantly evaluates all alternatives, prioritizes by connection time and elite status, auto-rebooks, sends notifications',
      proposedTimeMinutes: 4,
      proposedSuccessRate: 92,
      category: 'operational',
      priority: 5,
      implementationWave: 1,
      status: 'analyzed',
      regulatoryReferences: ['EU261 compensation', 'DOT tarmac delay rules'],
      kpis: {
        'rebooking_time': 'Average time to find and confirm alternative',
        'passenger_satisfaction': 'CSAT score for IROP handling',
        'successful_connections': '% of passengers who make their connection',
      },
    }).returning();

    // 2. OPERATIONS CONTROLLER PERSONA
    console.log('  Creating Operations Controller persona...');
    const [opsController] = await db.insert(personas).values({
      subdomainId: dispatchSubdomain.id,
      code: 'OC-001',
      name: 'Operations Controller',
      fullTitle: 'Operations Control Center (OCC) Controller',
      description: 'Real-time decision maker monitoring Copa Airlines network operations, managing disruptions, and coordinating recovery',
      responsibilities: [
        'Monitor real-time flight operations across network',
        'Identify and respond to operational disruptions',
        'Coordinate crew, aircraft, and passenger recovery',
        'Make go/no-go decisions for flights',
        'Optimize network flow and gate usage',
        'Communicate with stations, crew, and maintenance',
        'Ensure regulatory compliance and safety',
        'Manage cost vs customer service trade-offs',
      ],
      typicalExperience: '5-10 years in airline operations',
      reportsTo: 'OCC Manager',
      teamSizeRange: '4-6 controllers per shift',
      shiftPatterns: ['24/7 coverage in rotating shifts'],
      systemsUsed: ['OCC Dashboard', 'Flight Tracking', 'Crew Management', 'Weather Tools', 'IROP Recovery Tools'],
      painPoints: [
        'Information overload - monitoring 100+ flights simultaneously',
        'Delays in getting accurate real-time data',
        'Difficulty predicting downstream impacts of disruptions',
        'Manual coordination with multiple departments',
        'Lack of decision support for complex recovery scenarios',
        'Unable to optimize for both cost and customer satisfaction',
      ],
      goals: [
        'Maintain >85% on-time performance',
        'Minimize passenger misconnections',
        'Reduce operational costs during disruptions',
        'Ensure safety and regulatory compliance',
        'Improve communication with frontline staff',
      ],
      airlineTypes: ['hub_carrier', 'network_carrier'],
      icon: '🎮',
      sortOrder: 20,
    }).returning();

    // Operations Controller Use Case: Disruption Recovery
    console.log('  Creating Operations Controller use cases...');
    const [disruptionRecovery] = await db.insert(useCases).values({
      personaId: opsController.id,
      code: 'OC-UC-001',
      name: 'Weather Delay Recovery Coordination',
      description: 'Coordinate network recovery when weather delays cause cascading disruptions at Copa hub (PTY)',
      detailedNarrative: 'When thunderstorms close Panama City hub for 2 hours, OCC controller must quickly assess impact on 40+ inbound/outbound flights, resequence operations, rebook misconnecting passengers, manage crew legalities, and communicate with all stakeholders. Currently very manual and reactive.',
      frequency: 'weekly',
      typicalDurationMinutes: 180,
      timePressure: 'urgent',
      peakTimes: ['Afternoon thunderstorm season (Apr-Nov)'],
      triggers: ['Weather delays at hub', 'ATC ground stop', 'Multiple flight delays'],
      preconditions: ['OCC monitoring active', 'Weather data available'],
      postconditions: ['Recovery plan implemented', 'Passengers rebooked', 'Crew legal', 'Stakeholders notified'],
      complexity: 5,
      automationPotential: 4,
      currentPainLevel: 5,
      businessImpact: 'critical',
      estimatedAnnualOccurrences: 52, // ~weekly
      estimatedCostPerOccurrence: 95000, // $950 per disruption in cents
      currentProcess: 'Manual assessment of impacts, phone calls to coordinate, spreadsheets to track rebooking, manual crew reassignment',
      currentToolsUsed: ['OCC Dashboard', 'Flight Status Monitor', 'Crew System', 'Weather Radar', 'Phone/Email'],
      currentTimeMinutes: 180,
      currentSuccessRate: 72,
      proposedProcess: 'AI agent auto-detects disruption pattern, simulates recovery scenarios, proposes optimal resequencing, auto-coordinates with crew/gates/passengers',
      proposedTimeMinutes: 45,
      proposedSuccessRate: 88,
      category: 'operational',
      priority: 5,
      implementationWave: 1,
      status: 'designing',
      kpis: {
        'recovery_time': 'Time from disruption to full recovery',
        'passenger_impact': 'Number of misconnections prevented',
        'operational_cost': 'Total cost of disruption (crew, fuel, hotels, compensation)',
      },
    }).returning();

    // 3. RAMP SUPERVISOR PERSONA
    console.log('  Creating Ramp Supervisor persona...');
    const [rampSupervisor] = await db.insert(personas).values({
      subdomainId: rampSubdomain.id,
      code: 'RS-001',
      name: 'Ramp Supervisor',
      fullTitle: 'Ramp Operations Supervisor',
      description: 'Supervises ground handling team responsible for aircraft turnaround, baggage loading, and ramp safety at Copa stations',
      responsibilities: [
        'Coordinate aircraft turnaround operations',
        'Assign ramp crew to flights',
        'Ensure on-time departures',
        'Monitor baggage loading/unloading',
        'Conduct safety briefings and inspections',
        'Coordinate with operations and maintenance',
        'Manage ground equipment allocation',
        'Handle ramp incidents and delays',
      ],
      typicalExperience: '3-5 years in ground operations',
      reportsTo: 'Ground Operations Manager',
      teamSizeRange: '15-25 agents per shift',
      shiftPatterns: ['Morning (05:00-14:00)', 'Afternoon (14:00-23:00)', 'Night (23:00-08:00)'],
      systemsUsed: ['Flight Ops Dashboard', 'Weight & Balance', 'Equipment Tracking', 'Safety Reporting'],
      painPoints: [
        'Last-minute gate changes disrupt crew assignments',
        'Lack of real-time visibility into baggage loading progress',
        'Difficulty predicting turn times accurately',
        'Manual coordination with multiple parties (ops, catering, cleaning)',
        'Equipment shortages during peak periods',
        'Paper-based load plans and weight & balance',
      ],
      goals: [
        'Achieve <30 minute turnaround times',
        'Zero ramp safety incidents',
        'Minimize departure delays caused by ground ops',
        'Optimize crew utilization',
        'Reduce aircraft damage and baggage mishandling',
      ],
      airlineTypes: ['full_service', 'hub_carrier'],
      icon: '👷',
      sortOrder: 30,
    }).returning();

    // Ramp Supervisor Use Case: Turnaround Coordination
    console.log('  Creating Ramp Supervisor use cases...');
    const [turnaroundCoord] = await db.insert(useCases).values({
      personaId: rampSupervisor.id,
      code: 'RS-UC-001',
      name: 'Aircraft Turnaround Coordination',
      description: 'Coordinate all ground services for quick aircraft turnaround between flights',
      detailedNarrative: 'When aircraft arrives at gate, ramp supervisor must coordinate 8-10 different service providers (cleaning, catering, fueling, baggage, cargo) to complete turnaround in 30-45 minutes. Currently relies on manual tracking and phone calls.',
      frequency: 'multiple_daily',
      typicalDurationMinutes: 45,
      timePressure: 'urgent',
      peakTimes: ['06:00-10:00', '14:00-18:00'],
      triggers: ['Aircraft blocks in at gate'],
      preconditions: ['Gate available', 'Ground crew assigned', 'Equipment positioned'],
      postconditions: ['All services completed', 'Aircraft ready for boarding', 'On-time departure'],
      complexity: 4,
      automationPotential: 4,
      currentPainLevel: 4,
      businessImpact: 'high',
      estimatedAnnualOccurrences: 18000, // ~50 turns per day across Copa network
      estimatedCostPerOccurrence: 2800, // $28 in cents
      currentProcess: 'Manual calls to each service provider, visual inspection of progress, paper-based tracking, frequent radio check-ins',
      currentToolsUsed: ['Radio', 'Paper checklists', 'Flight Ops Dashboard'],
      currentTimeMinutes: 45,
      currentSuccessRate: 81,
      proposedProcess: 'Digital turnaround tracker with real-time status from all service providers, AI predicts delays, auto-alerts supervisor of issues',
      proposedTimeMinutes: 35,
      proposedSuccessRate: 93,
      category: 'operational',
      priority: 4,
      implementationWave: 1,
      status: 'identified',
      kpis: {
        'turnaround_time': 'Average time from block-in to block-out',
        'on_time_departure': '% of flights departing on schedule',
        'service_completion': '% of services completed before boarding',
      },
    }).returning();

    console.log('✅ Successfully seeded 3 personas and 4 use cases for Copa Airlines!');
    console.log(`  - ${gateAgent.name} (${gateAgent.code})`);
    console.log(`    - ${expressCheckIn.name}`);
    console.log(`    - ${iropRebooking.name}`);
    console.log(`  - ${opsController.name} (${opsController.code})`);
    console.log(`    - ${disruptionRecovery.name}`);
    console.log(`  - ${rampSupervisor.name} (${rampSupervisor.code})`);
    console.log(`    - ${turnaroundCoord.name}`);

  } catch (error) {
    console.error('❌ Error seeding personas and use cases:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedPersonasAndUseCases()
    .then(() => {
      console.log('\n🎉 Seed completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Seed failed:', error);
      process.exit(1);
    });
}

export { seedPersonasAndUseCases };
