import { Router } from 'express';
import { db } from '../db';
import { tools } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// GET /api/tools - Get all tools
router.get('/', async (req, res) => {
  try {
    const allTools = await db.query.tools.findMany({
      with: {
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
      orderBy: (tools, { asc }) => [asc(tools.name)],
    });
    res.json({ success: true, data: allTools });
  } catch (error) {
    console.error('Error fetching tools:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tools' });
  }
});

// GET /api/tools/:id - Get a single tool
router.get('/:id', async (req, res) => {
  try {
    const tool = await db.query.tools.findFirst({
      where: eq(tools.id, req.params.id),
      with: {
        mcp: {
          with: {
            subdomain: {
              with: {
                domain: true,
              },
            },
            agents: true,
          },
        },
      },
    });

    if (!tool) {
      return res.status(404).json({ success: false, error: 'Tool not found' });
    }

    res.json({ success: true, data: tool });
  } catch (error) {
    console.error('Error fetching tool:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tool' });
  }
});

// POST /api/tools - Create a new tool
router.post('/', async (req, res) => {
  try {
    const { mcpId, name, description, status } = req.body;

    if (!mcpId || !name) {
      return res.status(400).json({ error: 'mcpId and name are required' });
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

// PUT /api/tools/:id - Update a tool
router.put('/:id', async (req, res) => {
  try {
    const { name, description, status } = req.body;

    const [updatedTool] = await db
      .update(tools)
      .set({
        name,
        description,
        status,
        updatedAt: new Date(),
      })
      .where(eq(tools.id, req.params.id))
      .returning();

    if (!updatedTool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    res.json(updatedTool);
  } catch (error) {
    console.error('Error updating tool:', error);
    res.status(500).json({ error: 'Failed to update tool' });
  }
});

// DELETE /api/tools/:id - Delete a tool
router.delete('/:id', async (req, res) => {
  try {
    await db.delete(tools).where(eq(tools.id, req.params.id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting tool:', error);
    res.status(500).json({ error: 'Failed to delete tool' });
  }
});

export default router;
