import { Router } from 'express';
import { db } from '../db';
import { domains, subdomains } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// GET /api/domains - Get all domains with their subdomains
router.get('/', async (req, res) => {
  try {
    const allDomains = await db.query.domains.findMany({
      with: {
        subdomains: true,
      },
      orderBy: (domains, { asc }) => [asc(domains.name)],
    });
    res.json({ success: true, data: allDomains });
  } catch (error) {
    console.error('Error fetching domains:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch domains' });
  }
});

// GET /api/domains/:id - Get a single domain
router.get('/:id', async (req, res) => {
  try {
    const domain = await db.query.domains.findFirst({
      where: eq(domains.id, req.params.id),
      with: {
        subdomains: {
          with: {
            mcps: true,
            workflows: true,
          },
        },
      },
    });

    if (!domain) {
      return res.status(404).json({ success: false, error: 'Domain not found' });
    }

    res.json({ success: true, data: domain });
  } catch (error) {
    console.error('Error fetching domain:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch domain' });
  }
});

// POST /api/domains - Create a new domain
router.post('/', async (req, res) => {
  try {
    const { name, description, icon, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const [newDomain] = await db
      .insert(domains)
      .values({ name, description, icon, color })
      .returning();

    res.status(201).json(newDomain);
  } catch (error) {
    console.error('Error creating domain:', error);
    res.status(500).json({ error: 'Failed to create domain' });
  }
});

// PUT /api/domains/:id - Update a domain
router.put('/:id', async (req, res) => {
  try {
    const { name, description, icon, color } = req.body;

    const [updatedDomain] = await db
      .update(domains)
      .set({
        name,
        description,
        icon,
        color,
        updatedAt: new Date(),
      })
      .where(eq(domains.id, req.params.id))
      .returning();

    if (!updatedDomain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    res.json(updatedDomain);
  } catch (error) {
    console.error('Error updating domain:', error);
    res.status(500).json({ error: 'Failed to update domain' });
  }
});

// DELETE /api/domains/:id - Delete a domain
router.delete('/:id', async (req, res) => {
  try {
    await db.delete(domains).where(eq(domains.id, req.params.id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting domain:', error);
    res.status(500).json({ error: 'Failed to delete domain' });
  }
});

// Subdomain routes
// POST /api/domains/:domainId/subdomains - Create a subdomain
router.post('/:domainId/subdomains', async (req, res) => {
  try {
    const { name, description } = req.body;
    const { domainId } = req.params;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const [newSubdomain] = await db
      .insert(subdomains)
      .values({ domainId, name, description })
      .returning();

    res.status(201).json(newSubdomain);
  } catch (error) {
    console.error('Error creating subdomain:', error);
    res.status(500).json({ error: 'Failed to create subdomain' });
  }
});

export default router;
