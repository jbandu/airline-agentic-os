import { Router } from 'express';
import { db } from '../db';
import { mcps, tools } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// GET /api/mcps - Get all MCPs
router.get('/', async (req, res) => {
  try {
    const allMcps = await db.query.mcps.findMany({
      with: {
        subdomain: {
          with: {
            domain: true,
          },
        },
        tools: true,
        agents: true,
      },
      orderBy: (mcps, { asc }) => [asc(mcps.name)],
    });
    res.json({ success: true, data: allMcps });
  } catch (error) {
    console.error('Error fetching MCPs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch MCPs' });
  }
});

// GET /api/mcps/:id - Get a single MCP
router.get('/:id', async (req, res) => {
  try {
    const mcp = await db.query.mcps.findFirst({
      where: eq(mcps.id, req.params.id),
      with: {
        subdomain: {
          with: {
            domain: true,
          },
        },
        tools: true,
        agents: true,
        sourceDependencies: {
          with: {
            targetMcp: true,
          },
        },
        targetDependencies: {
          with: {
            sourceMcp: true,
          },
        },
      },
    });

    if (!mcp) {
      return res.status(404).json({ success: false, error: 'MCP not found' });
    }

    res.json({ success: true, data: mcp });
  } catch (error) {
    console.error('Error fetching MCP:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch MCP' });
  }
});

// POST /api/mcps - Create a new MCP
router.post('/', async (req, res) => {
  try {
    const { subdomainId, name, description, status, targetQuarter, owner } = req.body;

    if (!subdomainId || !name) {
      return res.status(400).json({ error: 'subdomainId and name are required' });
    }

    const [newMcp] = await db
      .insert(mcps)
      .values({ subdomainId, name, description, status, targetQuarter, owner })
      .returning();

    res.status(201).json(newMcp);
  } catch (error) {
    console.error('Error creating MCP:', error);
    res.status(500).json({ error: 'Failed to create MCP' });
  }
});

// PUT /api/mcps/:id - Update an MCP
router.put('/:id', async (req, res) => {
  try {
    const { name, description, status, targetQuarter, owner } = req.body;

    const [updatedMcp] = await db
      .update(mcps)
      .set({
        name,
        description,
        status,
        targetQuarter,
        owner,
        updatedAt: new Date(),
      })
      .where(eq(mcps.id, req.params.id))
      .returning();

    if (!updatedMcp) {
      return res.status(404).json({ error: 'MCP not found' });
    }

    res.json(updatedMcp);
  } catch (error) {
    console.error('Error updating MCP:', error);
    res.status(500).json({ error: 'Failed to update MCP' });
  }
});

// DELETE /api/mcps/:id - Delete an MCP
router.delete('/:id', async (req, res) => {
  try {
    await db.delete(mcps).where(eq(mcps.id, req.params.id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting MCP:', error);
    res.status(500).json({ error: 'Failed to delete MCP' });
  }
});

// Tool routes under MCPs
// POST /api/mcps/:mcpId/tools - Create a tool for an MCP
router.post('/:mcpId/tools', async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const { mcpId } = req.params;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const [newTool] = await db
      .insert(tools)
      .values({ mcpId, name, description, status })
      .returning();

    res.status(201).json(newTool);
  } catch (error) {
    console.error('Error creating tool:', error);
    res.status(500).json({ error: 'Failed to create tool' });
  }
});

export default router;
