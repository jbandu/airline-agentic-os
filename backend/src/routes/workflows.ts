import { Router } from 'express';
import { db } from '../db';
import { workflows, workflowMcps, workflowAgents } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// GET /api/workflows - Get all workflows
router.get('/', async (req, res) => {
  try {
    const allWorkflows = await db.query.workflows.findMany({
      with: {
        subdomain: {
          with: {
            domain: true,
          },
        },
        workflowMcps: {
          with: {
            mcp: true,
          },
        },
        workflowAgents: {
          with: {
            agent: {
              with: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: (workflows, { asc }) => [asc(workflows.name)],
    });
    res.json(allWorkflows);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

// GET /api/workflows/:id - Get a single workflow
router.get('/:id', async (req, res) => {
  try {
    const workflow = await db.query.workflows.findFirst({
      where: eq(workflows.id, req.params.id),
      with: {
        subdomain: {
          with: {
            domain: true,
          },
        },
        workflowMcps: {
          with: {
            mcp: {
              with: {
                tools: true,
              },
            },
          },
        },
        workflowAgents: {
          with: {
            agent: {
              with: {
                category: true,
                mcp: true,
              },
            },
          },
        },
      },
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json(workflow);
  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({ error: 'Failed to fetch workflow' });
  }
});

// POST /api/workflows - Create a new workflow
router.post('/', async (req, res) => {
  try {
    const {
      subdomainId,
      name,
      description,
      complexity,
      agenticPotential,
      implementationWave,
      status,
      expectedRoi,
      successMetrics,
    } = req.body;

    if (!subdomainId || !name) {
      return res.status(400).json({ error: 'subdomainId and name are required' });
    }

    const [newWorkflow] = await db
      .insert(workflows)
      .values({
        subdomainId,
        name,
        description,
        complexity,
        agenticPotential,
        implementationWave,
        status,
        expectedRoi,
        successMetrics,
      })
      .returning();

    res.status(201).json(newWorkflow);
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

// PUT /api/workflows/:id - Update a workflow
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      description,
      complexity,
      agenticPotential,
      implementationWave,
      status,
      expectedRoi,
      successMetrics,
    } = req.body;

    const [updatedWorkflow] = await db
      .update(workflows)
      .set({
        name,
        description,
        complexity,
        agenticPotential,
        implementationWave,
        status,
        expectedRoi,
        successMetrics,
        updatedAt: new Date(),
      })
      .where(eq(workflows.id, req.params.id))
      .returning();

    if (!updatedWorkflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json(updatedWorkflow);
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({ error: 'Failed to update workflow' });
  }
});

// DELETE /api/workflows/:id - Delete a workflow
router.delete('/:id', async (req, res) => {
  try {
    await db.delete(workflows).where(eq(workflows.id, req.params.id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
});

// Workflow-MCP associations
// POST /api/workflows/:workflowId/mcps - Associate an MCP with a workflow
router.post('/:workflowId/mcps', async (req, res) => {
  try {
    const { mcpId } = req.body;
    const { workflowId } = req.params;

    if (!mcpId) {
      return res.status(400).json({ error: 'mcpId is required' });
    }

    await db.insert(workflowMcps).values({ workflowId, mcpId });

    res.status(201).json({ message: 'MCP associated with workflow successfully' });
  } catch (error) {
    console.error('Error associating MCP with workflow:', error);
    res.status(500).json({ error: 'Failed to associate MCP with workflow' });
  }
});

// DELETE /api/workflows/:workflowId/mcps/:mcpId - Remove MCP from workflow
router.delete('/:workflowId/mcps/:mcpId', async (req, res) => {
  try {
    const { workflowId, mcpId } = req.params;

    await db
      .delete(workflowMcps)
      .where(eq(workflowMcps.workflowId, workflowId) && eq(workflowMcps.mcpId, mcpId));

    res.status(204).send();
  } catch (error) {
    console.error('Error removing MCP from workflow:', error);
    res.status(500).json({ error: 'Failed to remove MCP from workflow' });
  }
});

// Workflow-Agent associations
// POST /api/workflows/:workflowId/agents - Associate an agent with a workflow
router.post('/:workflowId/agents', async (req, res) => {
  try {
    const { agentId, role } = req.body;
    const { workflowId } = req.params;

    if (!agentId) {
      return res.status(400).json({ error: 'agentId is required' });
    }

    await db.insert(workflowAgents).values({ workflowId, agentId, role });

    res.status(201).json({ message: 'Agent associated with workflow successfully' });
  } catch (error) {
    console.error('Error associating agent with workflow:', error);
    res.status(500).json({ error: 'Failed to associate agent with workflow' });
  }
});

// DELETE /api/workflows/:workflowId/agents/:agentId - Remove agent from workflow
router.delete('/:workflowId/agents/:agentId', async (req, res) => {
  try {
    const { workflowId, agentId } = req.params;

    await db
      .delete(workflowAgents)
      .where(eq(workflowAgents.workflowId, workflowId) && eq(workflowAgents.agentId, agentId));

    res.status(204).send();
  } catch (error) {
    console.error('Error removing agent from workflow:', error);
    res.status(500).json({ error: 'Failed to remove agent from workflow' });
  }
});

export default router;
