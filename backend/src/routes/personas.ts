import { Router } from 'express';
import { db } from '../db';
import { personas, dayInLife } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// GET /api/personas - Get all personas with use cases
router.get('/', async (req, res) => {
  try {
    const { subdomainId, airlineType } = req.query;

    const allPersonas = await db.query.personas.findMany({
      with: {
        subdomain: true,
        useCases: {
          orderBy: (useCases, { desc }) => [desc(useCases.priority)],
        },
        dayInLife: true,
      },
      orderBy: (personas, { asc }) => [asc(personas.sortOrder), asc(personas.name)],
      where: subdomainId
        ? eq(personas.subdomainId, subdomainId as string)
        : undefined,
    });

    // Filter by airline type if provided
    let filteredPersonas = allPersonas;
    if (airlineType) {
      filteredPersonas = allPersonas.filter(persona =>
        persona.airlineTypes?.includes(airlineType as string)
      );
    }

    res.json({ success: true, data: filteredPersonas });
  } catch (error) {
    console.error('Error fetching personas:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch personas' });
  }
});

// GET /api/personas/:id - Get a single persona with full details
router.get('/:id', async (req, res) => {
  try {
    const persona = await db.query.personas.findFirst({
      where: eq(personas.id, req.params.id),
      with: {
        subdomain: {
          with: {
            domain: true,
          },
        },
        useCases: {
          with: {
            steps: {
              orderBy: (steps, { asc }) => [asc(steps.stepNumber)],
            },
          },
          orderBy: (useCases, { desc, asc }) => [
            desc(useCases.priority),
            asc(useCases.name),
          ],
        },
        dayInLife: true,
      },
    });

    if (!persona) {
      return res.status(404).json({ success: false, error: 'Persona not found' });
    }

    res.json({ success: true, data: persona });
  } catch (error) {
    console.error('Error fetching persona:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch persona' });
  }
});

// POST /api/personas - Create a new persona
router.post('/', async (req, res) => {
  try {
    const {
      subdomainId,
      code,
      name,
      fullTitle,
      description,
      responsibilities,
      typicalExperience,
      reportsTo,
      teamSizeRange,
      shiftPatterns,
      systemsUsed,
      painPoints,
      goals,
      airlineTypes,
      icon,
      sortOrder,
      metadata,
    } = req.body;

    if (!subdomainId || !code || !name) {
      return res.status(400).json({
        error: 'subdomainId, code, and name are required'
      });
    }

    const [newPersona] = await db
      .insert(personas)
      .values({
        subdomainId,
        code,
        name,
        fullTitle,
        description,
        responsibilities,
        typicalExperience,
        reportsTo,
        teamSizeRange,
        shiftPatterns,
        systemsUsed,
        painPoints,
        goals,
        airlineTypes,
        icon,
        sortOrder: sortOrder || 0,
        metadata,
      })
      .returning();

    res.status(201).json(newPersona);
  } catch (error) {
    console.error('Error creating persona:', error);
    res.status(500).json({ error: 'Failed to create persona' });
  }
});

// PUT /api/personas/:id - Update a persona
router.put('/:id', async (req, res) => {
  try {
    const {
      code,
      name,
      fullTitle,
      description,
      responsibilities,
      typicalExperience,
      reportsTo,
      teamSizeRange,
      shiftPatterns,
      systemsUsed,
      painPoints,
      goals,
      airlineTypes,
      icon,
      sortOrder,
      metadata,
    } = req.body;

    const [updatedPersona] = await db
      .update(personas)
      .set({
        code,
        name,
        fullTitle,
        description,
        responsibilities,
        typicalExperience,
        reportsTo,
        teamSizeRange,
        shiftPatterns,
        systemsUsed,
        painPoints,
        goals,
        airlineTypes,
        icon,
        sortOrder,
        metadata,
        updatedAt: new Date(),
      })
      .where(eq(personas.id, req.params.id))
      .returning();

    if (!updatedPersona) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    res.json(updatedPersona);
  } catch (error) {
    console.error('Error updating persona:', error);
    res.status(500).json({ error: 'Failed to update persona' });
  }
});

// DELETE /api/personas/:id - Delete a persona
router.delete('/:id', async (req, res) => {
  try {
    // Check if persona has use cases
    const persona = await db.query.personas.findFirst({
      where: eq(personas.id, req.params.id),
      with: {
        useCases: true,
      },
    });

    if (!persona) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    if (persona.useCases && persona.useCases.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete persona with existing use cases',
        useCaseCount: persona.useCases.length,
      });
    }

    await db.delete(personas).where(eq(personas.id, req.params.id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting persona:', error);
    res.status(500).json({ error: 'Failed to delete persona' });
  }
});

// Day in Life routes
// GET /api/personas/:id/day-in-life - Get all day-in-life docs for a persona
router.get('/:id/day-in-life', async (req, res) => {
  try {
    const dayInLifeDocs = await db.query.dayInLife.findMany({
      where: eq(dayInLife.personaId, req.params.id),
      orderBy: (dayInLife, { asc }) => [asc(dayInLife.shiftType)],
    });

    res.json({ success: true, data: dayInLifeDocs });
  } catch (error) {
    console.error('Error fetching day-in-life docs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch day-in-life docs' });
  }
});

// POST /api/personas/:id/day-in-life - Create a day-in-life document
router.post('/:id/day-in-life', async (req, res) => {
  try {
    const personaId = req.params.id;
    const {
      shiftType,
      narrative,
      startTime,
      endTime,
      totalHours,
      timeline,
      keyChallenges,
      decisionPoints,
      metricsTracked,
    } = req.body;

    if (!shiftType) {
      return res.status(400).json({ error: 'shiftType is required' });
    }

    const [newDayInLife] = await db
      .insert(dayInLife)
      .values({
        personaId,
        shiftType,
        narrative,
        startTime,
        endTime,
        totalHours,
        timeline,
        keyChallenges,
        decisionPoints,
        metricsTracked,
      })
      .returning();

    res.status(201).json(newDayInLife);
  } catch (error) {
    console.error('Error creating day-in-life:', error);
    res.status(500).json({ error: 'Failed to create day-in-life' });
  }
});

// PUT /api/personas/:personaId/day-in-life/:id - Update a day-in-life document
router.put('/:personaId/day-in-life/:id', async (req, res) => {
  try {
    const {
      shiftType,
      narrative,
      startTime,
      endTime,
      totalHours,
      timeline,
      keyChallenges,
      decisionPoints,
      metricsTracked,
    } = req.body;

    const [updatedDayInLife] = await db
      .update(dayInLife)
      .set({
        shiftType,
        narrative,
        startTime,
        endTime,
        totalHours,
        timeline,
        keyChallenges,
        decisionPoints,
        metricsTracked,
        updatedAt: new Date(),
      })
      .where(eq(dayInLife.id, req.params.id))
      .returning();

    if (!updatedDayInLife) {
      return res.status(404).json({ error: 'Day-in-life document not found' });
    }

    res.json(updatedDayInLife);
  } catch (error) {
    console.error('Error updating day-in-life:', error);
    res.status(500).json({ error: 'Failed to update day-in-life' });
  }
});

// DELETE /api/personas/:personaId/day-in-life/:id - Delete a day-in-life document
router.delete('/:personaId/day-in-life/:id', async (req, res) => {
  try {
    await db.delete(dayInLife).where(eq(dayInLife.id, req.params.id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting day-in-life:', error);
    res.status(500).json({ error: 'Failed to delete day-in-life' });
  }
});

export default router;
