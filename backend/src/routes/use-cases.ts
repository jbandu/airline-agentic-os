import { Router } from 'express';
import { db } from '../db';
import { useCases, useCaseSteps, useCaseWorkflows, useCaseAgents, useCaseTools } from '../db/schema';
import { eq, and, gte, lte, inArray } from 'drizzle-orm';

const router = Router();

// GET /api/use-cases - Get all use cases with filters
router.get('/', async (req, res) => {
  try {
    const {
      personaId,
      status,
      businessImpact,
      implementationWave,
      category,
      minPriority,
    } = req.query;

    let whereConditions: any[] = [];

    if (personaId) {
      whereConditions.push(eq(useCases.personaId, personaId as string));
    }

    if (status) {
      whereConditions.push(eq(useCases.status, status as any));
    }

    if (businessImpact) {
      whereConditions.push(eq(useCases.businessImpact, businessImpact as any));
    }

    if (implementationWave) {
      whereConditions.push(
        eq(useCases.implementationWave, parseInt(implementationWave as string))
      );
    }

    if (category) {
      whereConditions.push(eq(useCases.category, category as any));
    }

    if (minPriority) {
      whereConditions.push(
        gte(useCases.priority, parseInt(minPriority as string))
      );
    }

    const allUseCases = await db.query.useCases.findMany({
      with: {
        persona: {
          with: {
            subdomain: true,
          },
        },
        steps: {
          orderBy: (steps, { asc }) => [asc(steps.stepNumber)],
        },
      },
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      orderBy: (useCases, { desc, asc }) => [
        desc(useCases.priority),
        asc(useCases.name),
      ],
    });

    res.json(allUseCases);
  } catch (error) {
    console.error('Error fetching use cases:', error);
    res.status(500).json({ error: 'Failed to fetch use cases' });
  }
});

// GET /api/use-cases/:id - Get a single use case with full details
router.get('/:id', async (req, res) => {
  try {
    const useCase = await db.query.useCases.findFirst({
      where: eq(useCases.id, req.params.id),
      with: {
        persona: {
          with: {
            subdomain: {
              with: {
                domain: true,
              },
            },
          },
        },
        steps: {
          orderBy: (steps, { asc }) => [asc(steps.stepNumber)],
        },
      },
    });

    if (!useCase) {
      return res.status(404).json({ error: 'Use case not found' });
    }

    res.json(useCase);
  } catch (error) {
    console.error('Error fetching use case:', error);
    res.status(500).json({ error: 'Failed to fetch use case' });
  }
});

// POST /api/use-cases - Create a new use case
router.post('/', async (req, res) => {
  try {
    const {
      personaId,
      code,
      name,
      description,
      detailedNarrative,
      frequency,
      typicalDurationMinutes,
      timePressure,
      peakTimes,
      triggers,
      preconditions,
      postconditions,
      complexity,
      automationPotential,
      currentPainLevel,
      businessImpact,
      estimatedAnnualOccurrences,
      estimatedCostPerOccurrence,
      estimatedAnnualValue,
      currentProcess,
      currentToolsUsed,
      currentTimeMinutes,
      currentSuccessRate,
      proposedProcess,
      proposedTimeMinutes,
      proposedSuccessRate,
      category,
      priority,
      implementationWave,
      status,
      relatedUseCases,
      regulatoryReferences,
      kpis,
      metadata,
    } = req.body;

    if (!personaId || !code || !name) {
      return res.status(400).json({
        error: 'personaId, code, and name are required',
      });
    }

    const [newUseCase] = await db
      .insert(useCases)
      .values({
        personaId,
        code,
        name,
        description,
        detailedNarrative,
        frequency,
        typicalDurationMinutes,
        timePressure,
        peakTimes,
        triggers,
        preconditions,
        postconditions,
        complexity: complexity || 1,
        automationPotential: automationPotential || 1,
        currentPainLevel: currentPainLevel || 1,
        businessImpact,
        estimatedAnnualOccurrences,
        estimatedCostPerOccurrence,
        estimatedAnnualValue,
        currentProcess,
        currentToolsUsed,
        currentTimeMinutes,
        currentSuccessRate,
        proposedProcess,
        proposedTimeMinutes,
        proposedSuccessRate,
        category,
        priority: priority || 3,
        implementationWave: implementationWave || 1,
        status,
        relatedUseCases,
        regulatoryReferences,
        kpis,
        metadata,
      })
      .returning();

    res.status(201).json(newUseCase);
  } catch (error) {
    console.error('Error creating use case:', error);
    res.status(500).json({ error: 'Failed to create use case' });
  }
});

// PUT /api/use-cases/:id - Update a use case
router.put('/:id', async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      detailedNarrative,
      frequency,
      typicalDurationMinutes,
      timePressure,
      peakTimes,
      triggers,
      preconditions,
      postconditions,
      complexity,
      automationPotential,
      currentPainLevel,
      businessImpact,
      estimatedAnnualOccurrences,
      estimatedCostPerOccurrence,
      estimatedAnnualValue,
      currentProcess,
      currentToolsUsed,
      currentTimeMinutes,
      currentSuccessRate,
      proposedProcess,
      proposedTimeMinutes,
      proposedSuccessRate,
      category,
      priority,
      implementationWave,
      status,
      relatedUseCases,
      regulatoryReferences,
      kpis,
      metadata,
    } = req.body;

    const [updatedUseCase] = await db
      .update(useCases)
      .set({
        code,
        name,
        description,
        detailedNarrative,
        frequency,
        typicalDurationMinutes,
        timePressure,
        peakTimes,
        triggers,
        preconditions,
        postconditions,
        complexity,
        automationPotential,
        currentPainLevel,
        businessImpact,
        estimatedAnnualOccurrences,
        estimatedCostPerOccurrence,
        estimatedAnnualValue,
        currentProcess,
        currentToolsUsed,
        currentTimeMinutes,
        currentSuccessRate,
        proposedProcess,
        proposedTimeMinutes,
        proposedSuccessRate,
        category,
        priority,
        implementationWave,
        status,
        relatedUseCases,
        regulatoryReferences,
        kpis,
        metadata,
        updatedAt: new Date(),
      })
      .where(eq(useCases.id, req.params.id))
      .returning();

    if (!updatedUseCase) {
      return res.status(404).json({ error: 'Use case not found' });
    }

    res.json(updatedUseCase);
  } catch (error) {
    console.error('Error updating use case:', error);
    res.status(500).json({ error: 'Failed to update use case' });
  }
});

// DELETE /api/use-cases/:id - Delete a use case
router.delete('/:id', async (req, res) => {
  try {
    await db.delete(useCases).where(eq(useCases.id, req.params.id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting use case:', error);
    res.status(500).json({ error: 'Failed to delete use case' });
  }
});

// GET /api/use-cases/:id/roi - Calculate ROI for a use case
router.get('/:id/roi', async (req, res) => {
  try {
    const useCase = await db.query.useCases.findFirst({
      where: eq(useCases.id, req.params.id),
    });

    if (!useCase) {
      return res.status(404).json({ error: 'Use case not found' });
    }

    // Calculate ROI
    const currentAnnualCost =
      (useCase.estimatedAnnualOccurrences || 0) *
      ((useCase.estimatedCostPerOccurrence || 0) / 100);

    const proposedAnnualCost =
      (useCase.estimatedAnnualOccurrences || 0) *
      ((useCase.estimatedCostPerOccurrence || 0) / 100) *
      ((useCase.proposedTimeMinutes || 1) / (useCase.currentTimeMinutes || 1));

    const annualSavings = currentAnnualCost - proposedAnnualCost;

    const timeSavingsPerOccurrence =
      (useCase.currentTimeMinutes || 0) - (useCase.proposedTimeMinutes || 0);

    const annualTimeSavingsHours =
      ((useCase.estimatedAnnualOccurrences || 0) *
        timeSavingsPerOccurrence) /
      60;

    const successRateImprovement =
      (useCase.proposedSuccessRate || 100) -
      (useCase.currentSuccessRate || 100);

    const roiPercentage =
      currentAnnualCost > 0
        ? ((annualSavings / currentAnnualCost) * 100).toFixed(0)
        : '0';

    res.json({
      useCase: {
        id: useCase.id,
        code: useCase.code,
        name: useCase.name,
      },
      currentState: {
        timePerOccurrenceMinutes: useCase.currentTimeMinutes,
        successRate: useCase.currentSuccessRate,
        annualCost: currentAnnualCost,
      },
      proposedState: {
        timePerOccurrenceMinutes: useCase.proposedTimeMinutes,
        successRate: useCase.proposedSuccessRate,
        annualCost: proposedAnnualCost,
      },
      roi: {
        annualSavings,
        annualTimeSavingsHours,
        successRateImprovement,
        roiPercentage: `${roiPercentage}%`,
      },
      estimatedAnnualOccurrences: useCase.estimatedAnnualOccurrences,
    });
  } catch (error) {
    console.error('Error calculating ROI:', error);
    res.status(500).json({ error: 'Failed to calculate ROI' });
  }
});

// GET /api/use-cases/:id/automation-analysis - Analyze automation potential
router.get('/:id/automation-analysis', async (req, res) => {
  try {
    const useCase = await db.query.useCases.findFirst({
      where: eq(useCases.id, req.params.id),
      with: {
        steps: {
          orderBy: (steps, { asc }) => [asc(steps.stepNumber)],
        },
      },
    });

    if (!useCase) {
      return res.status(404).json({ error: 'Use case not found' });
    }

    const steps = useCase.steps || [];
    const totalSteps = steps.length;
    const automatableSteps = steps.filter((step) => step.canAutomate).length;
    const errorProneSteps = steps.filter((step) => step.errorProne).length;

    // Calculate time savings
    const currentTotalSeconds = steps.reduce(
      (sum, step) => sum + (step.currentDurationSeconds || 0),
      0
    );
    const targetTotalSeconds = steps.reduce(
      (sum, step) => sum + (step.targetDurationSeconds || 0),
      0
    );
    const timeSavingsSeconds = currentTotalSeconds - targetTotalSeconds;
    const timeSavingsPercentage =
      currentTotalSeconds > 0
        ? ((timeSavingsSeconds / currentTotalSeconds) * 100).toFixed(1)
        : '0';

    // Calculate automation percentage
    const automationPercentage =
      totalSteps > 0 ? ((automatableSteps / totalSteps) * 100).toFixed(1) : '0';

    // Calculate error reduction potential
    const errorReductionPercentage =
      totalSteps > 0 ? ((errorProneSteps / totalSteps) * 100).toFixed(1) : '0';

    // Complexity analysis
    const complexityScore = useCase.complexity || 1;
    const complexityReduction = automatableSteps > 0 ? 'high' : 'low';

    // Calculate annual time savings
    const annualOccurrences = useCase.estimatedAnnualOccurrences || 0;
    const annualTimeSavingsHours = (timeSavingsSeconds * annualOccurrences) / 3600;

    res.json({
      useCaseId: useCase.id,
      useCaseName: useCase.name,
      analysis: {
        totalSteps,
        automatableSteps,
        automationPercentage: `${automationPercentage}%`,
        errorProneSteps,
        errorReductionPercentage: `${errorReductionPercentage}%`,
        complexityScore,
        complexityReduction,
      },
      timeSavings: {
        currentTotalSeconds,
        targetTotalSeconds,
        savingsSeconds: timeSavingsSeconds,
        savingsMinutes: (timeSavingsSeconds / 60).toFixed(1),
        savingsPercentage: `${timeSavingsPercentage}%`,
        annualTimeSavingsHours: annualTimeSavingsHours.toFixed(1),
      },
      stepBreakdown: steps.map((step) => ({
        stepNumber: step.stepNumber,
        name: step.name,
        canAutomate: step.canAutomate,
        errorProne: step.errorProne,
        currentDuration: step.currentDurationSeconds,
        targetDuration: step.targetDurationSeconds,
        actionType: step.actionType,
        automationNotes: step.automationNotes,
      })),
    });
  } catch (error) {
    console.error('Error analyzing automation potential:', error);
    res.status(500).json({ error: 'Failed to analyze automation potential' });
  }
});

// Use Case Steps routes
// GET /api/use-cases/:id/steps - Get all steps for a use case
router.get('/:id/steps', async (req, res) => {
  try {
    const steps = await db.query.useCaseSteps.findMany({
      where: eq(useCaseSteps.useCaseId, req.params.id),
      orderBy: (steps, { asc }) => [asc(steps.stepNumber)],
    });

    res.json(steps);
  } catch (error) {
    console.error('Error fetching use case steps:', error);
    res.status(500).json({ error: 'Failed to fetch use case steps' });
  }
});

// POST /api/use-cases/:id/steps - Create a use case step
router.post('/:id/steps', async (req, res) => {
  try {
    const useCaseId = req.params.id;
    const {
      stepNumber,
      name,
      description,
      actor,
      actionType,
      currentDurationSeconds,
      targetDurationSeconds,
      canAutomate,
      automationNotes,
      errorProne,
      errorNotes,
      systemsInvolved,
      dataNeeded,
      dataProduced,
      decisionCriteria,
    } = req.body;

    if (!stepNumber || !name) {
      return res.status(400).json({
        error: 'stepNumber and name are required',
      });
    }

    const [newStep] = await db
      .insert(useCaseSteps)
      .values({
        useCaseId,
        stepNumber,
        name,
        description,
        actor,
        actionType,
        currentDurationSeconds,
        targetDurationSeconds,
        canAutomate: canAutomate || false,
        automationNotes,
        errorProne: errorProne || false,
        errorNotes,
        systemsInvolved,
        dataNeeded,
        dataProduced,
        decisionCriteria,
      })
      .returning();

    res.status(201).json(newStep);
  } catch (error) {
    console.error('Error creating use case step:', error);
    res.status(500).json({ error: 'Failed to create use case step' });
  }
});

// PUT /api/use-cases/:useCaseId/steps/:id - Update a use case step
router.put('/:useCaseId/steps/:id', async (req, res) => {
  try {
    const {
      stepNumber,
      name,
      description,
      actor,
      actionType,
      currentDurationSeconds,
      targetDurationSeconds,
      canAutomate,
      automationNotes,
      errorProne,
      errorNotes,
      systemsInvolved,
      dataNeeded,
      dataProduced,
      decisionCriteria,
    } = req.body;

    const [updatedStep] = await db
      .update(useCaseSteps)
      .set({
        stepNumber,
        name,
        description,
        actor,
        actionType,
        currentDurationSeconds,
        targetDurationSeconds,
        canAutomate,
        automationNotes,
        errorProne,
        errorNotes,
        systemsInvolved,
        dataNeeded,
        dataProduced,
        decisionCriteria,
      })
      .where(eq(useCaseSteps.id, req.params.id))
      .returning();

    if (!updatedStep) {
      return res.status(404).json({ error: 'Use case step not found' });
    }

    res.json(updatedStep);
  } catch (error) {
    console.error('Error updating use case step:', error);
    res.status(500).json({ error: 'Failed to update use case step' });
  }
});

// DELETE /api/use-cases/:useCaseId/steps/:id - Delete a use case step
router.delete('/:useCaseId/steps/:id', async (req, res) => {
  try {
    await db.delete(useCaseSteps).where(eq(useCaseSteps.id, req.params.id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting use case step:', error);
    res.status(500).json({ error: 'Failed to delete use case step' });
  }
});

// Workflow Linking Routes
// GET /api/use-cases/:id/workflows - Get all workflows linked to a use case
router.get('/:id/workflows', async (req, res) => {
  try {
    const links = await db.query.useCaseWorkflows.findMany({
      where: eq(useCaseWorkflows.useCaseId, req.params.id),
      with: {
        workflow: {
          with: {
            subdomain: true,
          },
        },
      },
    });

    res.json(links);
  } catch (error) {
    console.error('Error fetching use case workflows:', error);
    res.status(500).json({ error: 'Failed to fetch use case workflows' });
  }
});

// POST /api/use-cases/:id/workflows - Link a workflow to a use case
router.post('/:id/workflows', async (req, res) => {
  try {
    const { workflowId, coverage, coveragePercentage, notes } = req.body;

    if (!workflowId) {
      return res.status(400).json({ error: 'workflowId is required' });
    }

    const [newLink] = await db
      .insert(useCaseWorkflows)
      .values({
        useCaseId: req.params.id,
        workflowId,
        coverage: coverage || 'partial',
        coveragePercentage,
        notes,
      })
      .returning();

    res.status(201).json(newLink);
  } catch (error) {
    console.error('Error linking workflow to use case:', error);
    res.status(500).json({ error: 'Failed to link workflow to use case' });
  }
});

// DELETE /api/use-cases/:id/workflows/:workflowId - Unlink a workflow from a use case
router.delete('/:id/workflows/:workflowId', async (req, res) => {
  try {
    await db
      .delete(useCaseWorkflows)
      .where(
        and(
          eq(useCaseWorkflows.useCaseId, req.params.id),
          eq(useCaseWorkflows.workflowId, req.params.workflowId)
        )
      );

    res.status(204).send();
  } catch (error) {
    console.error('Error unlinking workflow from use case:', error);
    res.status(500).json({ error: 'Failed to unlink workflow from use case' });
  }
});

// Agent Linking Routes
// GET /api/use-cases/:id/agents - Get all agents linked to a use case
router.get('/:id/agents', async (req, res) => {
  try {
    const links = await db.query.useCaseAgents.findMany({
      where: eq(useCaseAgents.useCaseId, req.params.id),
      with: {
        agent: {
          with: {
            category: true,
          },
        },
      },
    });

    res.json(links);
  } catch (error) {
    console.error('Error fetching use case agents:', error);
    res.status(500).json({ error: 'Failed to fetch use case agents' });
  }
});

// POST /api/use-cases/:id/agents - Link an agent to a use case
router.post('/:id/agents', async (req, res) => {
  try {
    const { agentId, role, notes } = req.body;

    if (!agentId) {
      return res.status(400).json({ error: 'agentId is required' });
    }

    const [newLink] = await db
      .insert(useCaseAgents)
      .values({
        useCaseId: req.params.id,
        agentId,
        role,
        notes,
      })
      .returning();

    res.status(201).json(newLink);
  } catch (error) {
    console.error('Error linking agent to use case:', error);
    res.status(500).json({ error: 'Failed to link agent to use case' });
  }
});

// DELETE /api/use-cases/:id/agents/:agentId - Unlink an agent from a use case
router.delete('/:id/agents/:agentId', async (req, res) => {
  try {
    await db
      .delete(useCaseAgents)
      .where(
        and(
          eq(useCaseAgents.useCaseId, req.params.id),
          eq(useCaseAgents.agentId, req.params.agentId)
        )
      );

    res.status(204).send();
  } catch (error) {
    console.error('Error unlinking agent from use case:', error);
    res.status(500).json({ error: 'Failed to unlink agent from use case' });
  }
});

// Tool Linking Routes
// GET /api/use-cases/:id/tools - Get all tools linked to a use case
router.get('/:id/tools', async (req, res) => {
  try {
    const links = await db.query.useCaseTools.findMany({
      where: eq(useCaseTools.useCaseId, req.params.id),
      with: {
        tool: {
          with: {
            mcp: true,
          },
        },
      },
    });

    res.json(links);
  } catch (error) {
    console.error('Error fetching use case tools:', error);
    res.status(500).json({ error: 'Failed to fetch use case tools' });
  }
});

// POST /api/use-cases/:id/tools - Link a tool to a use case
router.post('/:id/tools', async (req, res) => {
  try {
    const { toolId, role, notes } = req.body;

    if (!toolId) {
      return res.status(400).json({ error: 'toolId is required' });
    }

    const [newLink] = await db
      .insert(useCaseTools)
      .values({
        useCaseId: req.params.id,
        toolId,
        role,
        notes,
      })
      .returning();

    res.status(201).json(newLink);
  } catch (error) {
    console.error('Error linking tool to use case:', error);
    res.status(500).json({ error: 'Failed to link tool to use case' });
  }
});

// DELETE /api/use-cases/:id/tools/:toolId - Unlink a tool from a use case
router.delete('/:id/tools/:toolId', async (req, res) => {
  try {
    await db
      .delete(useCaseTools)
      .where(
        and(
          eq(useCaseTools.useCaseId, req.params.id),
          eq(useCaseTools.toolId, req.params.toolId)
        )
      );

    res.status(204).send();
  } catch (error) {
    console.error('Error unlinking tool from use case:', error);
    res.status(500).json({ error: 'Failed to unlink tool from use case' });
  }
});

export default router;
