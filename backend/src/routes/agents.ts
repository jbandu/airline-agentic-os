import { Router } from 'express';
import { db } from '../db';
import { agents, agentCategories, agentCollaborations } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// GET /api/agents - Get all agents
router.get('/', async (req, res) => {
  try {
    const allAgents = await db.query.agents.findMany({
      with: {
        category: true,
        mcp: {
          with: {
            subdomain: {
              with: {
                domain: true,
              },
            },
          },
        },
        sourceCollaborations: {
          with: {
            targetAgent: true,
          },
        },
        targetCollaborations: {
          with: {
            sourceAgent: true,
          },
        },
      },
      orderBy: (agents, { asc }) => [asc(agents.name)],
    });
    res.json(allAgents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// GET /api/agents/:id - Get a single agent
router.get('/:id', async (req, res) => {
  try {
    const agent = await db.query.agents.findFirst({
      where: eq(agents.id, req.params.id),
      with: {
        category: true,
        mcp: {
          with: {
            subdomain: {
              with: {
                domain: true,
              },
            },
            tools: true,
          },
        },
        workflowAgents: {
          with: {
            workflow: true,
          },
        },
        sourceCollaborations: {
          with: {
            targetAgent: {
              with: {
                category: true,
              },
            },
          },
        },
        targetCollaborations: {
          with: {
            sourceAgent: {
              with: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(agent);
  } catch (error) {
    console.error('Error fetching agent:', error);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

// POST /api/agents - Create a new agent
router.post('/', async (req, res) => {
  try {
    const { code, name, categoryCode, description, autonomyLevel, mcpId, active, metadata } = req.body;

    if (!code || !name || !categoryCode) {
      return res.status(400).json({ error: 'code, name, and categoryCode are required' });
    }

    const [newAgent] = await db
      .insert(agents)
      .values({ code, name, categoryCode, description, autonomyLevel, mcpId, active, metadata })
      .returning();

    res.status(201).json(newAgent);
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

// PUT /api/agents/:id - Update an agent
router.put('/:id', async (req, res) => {
  try {
    const { name, description, autonomyLevel, mcpId, active, metadata } = req.body;

    const [updatedAgent] = await db
      .update(agents)
      .set({
        name,
        description,
        autonomyLevel,
        mcpId,
        active,
        metadata,
        updatedAt: new Date(),
      })
      .where(eq(agents.id, req.params.id))
      .returning();

    if (!updatedAgent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(updatedAgent);
  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

// DELETE /api/agents/:id - Delete an agent
router.delete('/:id', async (req, res) => {
  try {
    await db.delete(agents).where(eq(agents.id, req.params.id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting agent:', error);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

// GET /api/agents/network - Get full agent network for visualization
router.get('/network', async (req, res) => {
  try {
    const allAgents = await db.query.agents.findMany({
      with: {
        category: true,
        mcp: {
          with: {
            subdomain: {
              with: {
                domain: true,
              },
            },
          },
        },
      },
    });

    const allCollaborations = await db.query.agentCollaborations.findMany({
      with: {
        sourceAgent: {
          with: {
            category: true,
          },
        },
        targetAgent: {
          with: {
            category: true,
          },
        },
      },
    });

    // Format for network visualization
    const nodes = allAgents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      code: agent.code,
      category: agent.category.code,
      categoryName: agent.category.name,
      categoryColor: agent.category.color,
      categoryIcon: agent.category.icon,
      autonomyLevel: agent.autonomyLevel,
      domain: agent.mcp?.subdomain?.domain?.name,
      subdomain: agent.mcp?.subdomain?.name,
      active: agent.active,
    }));

    const edges = allCollaborations.map((collab) => ({
      id: collab.id,
      source: collab.sourceAgentId,
      target: collab.targetAgentId,
      type: collab.collaborationType,
      strength: collab.strength,
      bidirectional: collab.bidirectional,
    }));

    res.json({
      success: true,
      data: {
        nodes,
        edges,
      },
    });
  } catch (error) {
    console.error('Error fetching agent network:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch agent network' });
  }
});

// Agent Categories routes
// GET /api/agents/categories - Get all agent categories
router.get('/categories/all', async (req, res) => {
  try {
    const categories = await db.query.agentCategories.findMany({
      with: {
        agents: true,
      },
      orderBy: (agentCategories, { asc }) => [asc(agentCategories.name)],
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching agent categories:', error);
    res.status(500).json({ error: 'Failed to fetch agent categories' });
  }
});

// POST /api/agents/categories - Create an agent category
router.post('/categories', async (req, res) => {
  try {
    const { code, name, description, icon, color } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: 'code and name are required' });
    }

    const [newCategory] = await db
      .insert(agentCategories)
      .values({ code, name, description, icon, color })
      .returning();

    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating agent category:', error);
    res.status(500).json({ error: 'Failed to create agent category' });
  }
});

// Agent Collaborations routes
// POST /api/agents/:agentId/collaborations - Create agent collaboration
router.post('/:agentId/collaborations', async (req, res) => {
  try {
    const { targetAgentId, collaborationType, strength, bidirectional } = req.body;
    const { agentId } = req.params;

    if (!targetAgentId || !collaborationType) {
      return res.status(400).json({ error: 'targetAgentId and collaborationType are required' });
    }

    const [newCollaboration] = await db
      .insert(agentCollaborations)
      .values({
        sourceAgentId: agentId,
        targetAgentId,
        collaborationType,
        strength: strength || 1,
        bidirectional: bidirectional || false,
      })
      .returning();

    res.status(201).json(newCollaboration);
  } catch (error) {
    console.error('Error creating agent collaboration:', error);
    res.status(500).json({ error: 'Failed to create agent collaboration' });
  }
});

export default router;
