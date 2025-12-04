import { Router } from 'express';
import { db } from '../db';
import { crossDomainBridges, mcpDependencies } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Cross-Domain Bridges routes
// GET /api/cross-domain/bridges - Get all cross-domain bridges
router.get('/bridges', async (req, res) => {
  try {
    const bridges = await db.query.crossDomainBridges.findMany({
      with: {
        sourceSubdomain: {
          with: {
            domain: true,
          },
        },
        targetSubdomain: {
          with: {
            domain: true,
          },
        },
      },
    });
    res.json(bridges);
  } catch (error) {
    console.error('Error fetching cross-domain bridges:', error);
    res.status(500).json({ error: 'Failed to fetch cross-domain bridges' });
  }
});

// GET /api/cross-domain/bridges/:id - Get a single bridge
router.get('/bridges/:id', async (req, res) => {
  try {
    const bridge = await db.query.crossDomainBridges.findFirst({
      where: eq(crossDomainBridges.id, req.params.id),
      with: {
        sourceSubdomain: {
          with: {
            domain: true,
            mcps: true,
          },
        },
        targetSubdomain: {
          with: {
            domain: true,
            mcps: true,
          },
        },
      },
    });

    if (!bridge) {
      return res.status(404).json({ error: 'Bridge not found' });
    }

    res.json(bridge);
  } catch (error) {
    console.error('Error fetching bridge:', error);
    res.status(500).json({ error: 'Failed to fetch bridge' });
  }
});

// POST /api/cross-domain/bridges - Create a cross-domain bridge
router.post('/bridges', async (req, res) => {
  try {
    const { sourceSubdomainId, targetSubdomainId, bridgeType, name, description, strength } = req.body;

    if (!sourceSubdomainId || !targetSubdomainId || !bridgeType || !name) {
      return res.status(400).json({
        error: 'sourceSubdomainId, targetSubdomainId, bridgeType, and name are required'
      });
    }

    const [newBridge] = await db
      .insert(crossDomainBridges)
      .values({ sourceSubdomainId, targetSubdomainId, bridgeType, name, description, strength })
      .returning();

    res.status(201).json(newBridge);
  } catch (error) {
    console.error('Error creating cross-domain bridge:', error);
    res.status(500).json({ error: 'Failed to create cross-domain bridge' });
  }
});

// PUT /api/cross-domain/bridges/:id - Update a bridge
router.put('/bridges/:id', async (req, res) => {
  try {
    const { bridgeType, name, description, strength } = req.body;

    const [updatedBridge] = await db
      .update(crossDomainBridges)
      .set({ bridgeType, name, description, strength })
      .where(eq(crossDomainBridges.id, req.params.id))
      .returning();

    if (!updatedBridge) {
      return res.status(404).json({ error: 'Bridge not found' });
    }

    res.json(updatedBridge);
  } catch (error) {
    console.error('Error updating bridge:', error);
    res.status(500).json({ error: 'Failed to update bridge' });
  }
});

// DELETE /api/cross-domain/bridges/:id - Delete a bridge
router.delete('/bridges/:id', async (req, res) => {
  try {
    await db.delete(crossDomainBridges).where(eq(crossDomainBridges.id, req.params.id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting bridge:', error);
    res.status(500).json({ error: 'Failed to delete bridge' });
  }
});

// MCP Dependencies routes
// GET /api/cross-domain/mcp-dependencies - Get all MCP dependencies
router.get('/mcp-dependencies', async (req, res) => {
  try {
    const dependencies = await db.query.mcpDependencies.findMany({
      with: {
        sourceMcp: {
          with: {
            subdomain: {
              with: {
                domain: true,
              },
            },
          },
        },
        targetMcp: {
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
    res.json(dependencies);
  } catch (error) {
    console.error('Error fetching MCP dependencies:', error);
    res.status(500).json({ error: 'Failed to fetch MCP dependencies' });
  }
});

// GET /api/cross-domain/mcp-dependencies/:id - Get a single MCP dependency
router.get('/mcp-dependencies/:id', async (req, res) => {
  try {
    const dependency = await db.query.mcpDependencies.findFirst({
      where: eq(mcpDependencies.id, req.params.id),
      with: {
        sourceMcp: {
          with: {
            subdomain: {
              with: {
                domain: true,
              },
            },
            tools: true,
          },
        },
        targetMcp: {
          with: {
            subdomain: {
              with: {
                domain: true,
              },
            },
            tools: true,
          },
        },
      },
    });

    if (!dependency) {
      return res.status(404).json({ error: 'MCP dependency not found' });
    }

    res.json(dependency);
  } catch (error) {
    console.error('Error fetching MCP dependency:', error);
    res.status(500).json({ error: 'Failed to fetch MCP dependency' });
  }
});

// POST /api/cross-domain/mcp-dependencies - Create an MCP dependency
router.post('/mcp-dependencies', async (req, res) => {
  try {
    const { sourceMcpId, targetMcpId, dependencyType, description } = req.body;

    if (!sourceMcpId || !targetMcpId || !dependencyType) {
      return res.status(400).json({
        error: 'sourceMcpId, targetMcpId, and dependencyType are required'
      });
    }

    const [newDependency] = await db
      .insert(mcpDependencies)
      .values({ sourceMcpId, targetMcpId, dependencyType, description })
      .returning();

    res.status(201).json(newDependency);
  } catch (error) {
    console.error('Error creating MCP dependency:', error);
    res.status(500).json({ error: 'Failed to create MCP dependency' });
  }
});

// PUT /api/cross-domain/mcp-dependencies/:id - Update an MCP dependency
router.put('/mcp-dependencies/:id', async (req, res) => {
  try {
    const { dependencyType, description } = req.body;

    const [updatedDependency] = await db
      .update(mcpDependencies)
      .set({ dependencyType, description })
      .where(eq(mcpDependencies.id, req.params.id))
      .returning();

    if (!updatedDependency) {
      return res.status(404).json({ error: 'MCP dependency not found' });
    }

    res.json(updatedDependency);
  } catch (error) {
    console.error('Error updating MCP dependency:', error);
    res.status(500).json({ error: 'Failed to update MCP dependency' });
  }
});

// DELETE /api/cross-domain/mcp-dependencies/:id - Delete an MCP dependency
router.delete('/mcp-dependencies/:id', async (req, res) => {
  try {
    await db.delete(mcpDependencies).where(eq(mcpDependencies.id, req.params.id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting MCP dependency:', error);
    res.status(500).json({ error: 'Failed to delete MCP dependency' });
  }
});

export default router;
