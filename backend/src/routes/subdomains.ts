import { Router } from 'express';
import { db } from '../db';
import { subdomains } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// GET /api/subdomains - Get all subdomains with domain info
router.get('/', async (req, res) => {
  try {
    const allSubdomains = await db.query.subdomains.findMany({
      with: {
        domain: true,
        mcps: {
          with: {
            tools: true,
          },
        },
        workflows: true,
      },
      orderBy: (subdomains, { asc }) => [asc(subdomains.name)],
    });

    res.json({ success: true, data: allSubdomains });
  } catch (error) {
    console.error('Error fetching subdomains:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch subdomains' });
  }
});

// GET /api/subdomains/:id - Get a single subdomain with MCPs and workflows
router.get('/:id', async (req, res) => {
  try {
    const subdomain = await db.query.subdomains.findFirst({
      where: eq(subdomains.id, req.params.id),
      with: {
        domain: true,
        mcps: {
          with: {
            tools: true,
          },
        },
        workflows: {
          with: {
            workflowMcps: {
              with: {
                mcp: true,
              },
            },
            workflowAgents: {
              with: {
                agent: true,
              },
            },
          },
        },
        sourceBridges: {
          with: {
            targetSubdomain: {
              with: {
                domain: true,
              },
            },
          },
        },
        targetBridges: {
          with: {
            sourceSubdomain: {
              with: {
                domain: true,
              },
            },
          },
        },
      },
    });

    if (!subdomain) {
      return res.status(404).json({ success: false, error: 'Subdomain not found' });
    }

    res.json({ success: true, data: subdomain });
  } catch (error) {
    console.error('Error fetching subdomain:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch subdomain' });
  }
});

// GET /api/domains/:domainId/subdomains - Get subdomains by domain
router.get('/by-domain/:domainId', async (req, res) => {
  try {
    const domainSubdomains = await db.query.subdomains.findMany({
      where: eq(subdomains.domainId, req.params.domainId),
      with: {
        mcps: {
          with: {
            tools: true,
          },
        },
        workflows: true,
      },
      orderBy: (subdomains, { asc }) => [asc(subdomains.name)],
    });

    res.json({ success: true, data: domainSubdomains });
  } catch (error) {
    console.error('Error fetching subdomains by domain:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch subdomains' });
  }
});

// POST /api/subdomains - Create a new subdomain
router.post('/', async (req, res) => {
  try {
    const [newSubdomain] = await db
      .insert(subdomains)
      .values(req.body)
      .returning();

    res.status(201).json({ success: true, data: newSubdomain });
  } catch (error) {
    console.error('Error creating subdomain:', error);
    res.status(500).json({ success: false, error: 'Failed to create subdomain' });
  }
});

// PUT /api/subdomains/:id - Update a subdomain
router.put('/:id', async (req, res) => {
  try {
    const [updatedSubdomain] = await db
      .update(subdomains)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(subdomains.id, req.params.id))
      .returning();

    if (!updatedSubdomain) {
      return res.status(404).json({ success: false, error: 'Subdomain not found' });
    }

    res.json({ success: true, data: updatedSubdomain });
  } catch (error) {
    console.error('Error updating subdomain:', error);
    res.status(500).json({ success: false, error: 'Failed to update subdomain' });
  }
});

// DELETE /api/subdomains/:id - Delete a subdomain
router.delete('/:id', async (req, res) => {
  try {
    const [deletedSubdomain] = await db
      .delete(subdomains)
      .where(eq(subdomains.id, req.params.id))
      .returning();

    if (!deletedSubdomain) {
      return res.status(404).json({ success: false, error: 'Subdomain not found' });
    }

    res.json({ success: true, data: deletedSubdomain });
  } catch (error) {
    console.error('Error deleting subdomain:', error);
    res.status(500).json({ success: false, error: 'Failed to delete subdomain' });
  }
});

export default router;
