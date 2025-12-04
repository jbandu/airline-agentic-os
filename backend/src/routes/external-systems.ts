import { Router } from 'express';
import { db } from '../db';
import { externalSystems, systemStubs } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

// GET /api/external-systems - Get all external systems
router.get('/', async (req, res) => {
  try {
    const { systemType, status } = req.query;

    let whereConditions: any[] = [];

    if (systemType) {
      whereConditions.push(eq(externalSystems.systemType, systemType as any));
    }
    if (status) {
      whereConditions.push(eq(externalSystems.status, status as any));
    }

    const systems = await db.query.externalSystems.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      with: {
        stubs: {
          orderBy: (stubs, { desc }) => [desc(stubs.updatedAt)],
        },
      },
      orderBy: (systems, { desc }) => [desc(systems.updatedAt)],
    });

    res.json(systems);
  } catch (error) {
    console.error('Error fetching external systems:', error);
    res.status(500).json({ error: 'Failed to fetch external systems' });
  }
});

// GET /api/external-systems/:id - Get a single external system
router.get('/:id', async (req, res) => {
  try {
    const system = await db.query.externalSystems.findFirst({
      where: eq(externalSystems.id, req.params.id),
      with: {
        stubs: {
          orderBy: (stubs, { desc }) => [desc(stubs.updatedAt)],
        },
      },
    });

    if (!system) {
      return res.status(404).json({ error: 'External system not found' });
    }

    res.json(system);
  } catch (error) {
    console.error('Error fetching external system:', error);
    res.status(500).json({ error: 'Failed to fetch external system' });
  }
});

// POST /api/external-systems - Create a new external system
router.post('/', async (req, res) => {
  try {
    const {
      name,
      vendor,
      systemType,
      status,
      version,
      description,
      apiDocumentation,
      contactInfo,
      integrationRequirements,
      dataContract,
      slaRequirements,
      costPerCall,
      notes,
      metadata,
    } = req.body;

    if (!name || !systemType) {
      return res.status(400).json({
        error: 'name and systemType are required',
      });
    }

    const [newSystem] = await db
      .insert(externalSystems)
      .values({
        name,
        vendor,
        systemType,
        status: status || 'planned',
        version,
        description,
        apiDocumentation,
        contactInfo,
        integrationRequirements,
        dataContract,
        slaRequirements,
        costPerCall,
        notes,
        metadata,
      })
      .returning();

    res.status(201).json(newSystem);
  } catch (error) {
    console.error('Error creating external system:', error);
    res.status(500).json({ error: 'Failed to create external system' });
  }
});

// PUT /api/external-systems/:id - Update an external system
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      vendor,
      systemType,
      status,
      version,
      description,
      apiDocumentation,
      contactInfo,
      integrationRequirements,
      dataContract,
      slaRequirements,
      costPerCall,
      notes,
      metadata,
    } = req.body;

    const [updatedSystem] = await db
      .update(externalSystems)
      .set({
        name,
        vendor,
        systemType,
        status,
        version,
        description,
        apiDocumentation,
        contactInfo,
        integrationRequirements,
        dataContract,
        slaRequirements,
        costPerCall,
        notes,
        metadata,
        updatedAt: new Date(),
      })
      .where(eq(externalSystems.id, req.params.id))
      .returning();

    if (!updatedSystem) {
      return res.status(404).json({ error: 'External system not found' });
    }

    res.json(updatedSystem);
  } catch (error) {
    console.error('Error updating external system:', error);
    res.status(500).json({ error: 'Failed to update external system' });
  }
});

// DELETE /api/external-systems/:id - Delete an external system
router.delete('/:id', async (req, res) => {
  try {
    await db.delete(externalSystems).where(eq(externalSystems.id, req.params.id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting external system:', error);
    res.status(500).json({ error: 'Failed to delete external system' });
  }
});

// GET /api/external-systems/:id/stubs - Get all stubs for a system
router.get('/:id/stubs', async (req, res) => {
  try {
    const stubs = await db.query.systemStubs.findMany({
      where: eq(systemStubs.externalSystemId, req.params.id),
      orderBy: (stubs, { desc }) => [desc(stubs.updatedAt)],
    });

    res.json(stubs);
  } catch (error) {
    console.error('Error fetching system stubs:', error);
    res.status(500).json({ error: 'Failed to fetch system stubs' });
  }
});

// POST /api/external-systems/:id/stubs - Create a new stub for a system
router.post('/:id/stubs', async (req, res) => {
  try {
    const {
      name,
      status,
      description,
      stubType,
      endpoint,
      mockData,
      responseExamples,
      latencyMs,
      errorScenarios,
      testResults,
      notes,
      metadata,
    } = req.body;

    if (!name || !stubType) {
      return res.status(400).json({
        error: 'name and stubType are required',
      });
    }

    const [newStub] = await db
      .insert(systemStubs)
      .values({
        externalSystemId: req.params.id,
        name,
        status: status || 'draft',
        description,
        stubType,
        endpoint,
        mockData,
        responseExamples,
        latencyMs,
        errorScenarios,
        testResults,
        notes,
        metadata,
      })
      .returning();

    res.status(201).json(newStub);
  } catch (error) {
    console.error('Error creating system stub:', error);
    res.status(500).json({ error: 'Failed to create system stub' });
  }
});

// GET /api/external-systems/:id/stubs/:stubId - Get a specific stub
router.get('/:id/stubs/:stubId', async (req, res) => {
  try {
    const stub = await db.query.systemStubs.findFirst({
      where: and(
        eq(systemStubs.id, req.params.stubId),
        eq(systemStubs.externalSystemId, req.params.id)
      ),
    });

    if (!stub) {
      return res.status(404).json({ error: 'System stub not found' });
    }

    res.json(stub);
  } catch (error) {
    console.error('Error fetching system stub:', error);
    res.status(500).json({ error: 'Failed to fetch system stub' });
  }
});

// PUT /api/external-systems/:id/stubs/:stubId - Update a stub
router.put('/:id/stubs/:stubId', async (req, res) => {
  try {
    const {
      name,
      status,
      description,
      stubType,
      endpoint,
      mockData,
      responseExamples,
      latencyMs,
      errorScenarios,
      testResults,
      notes,
      metadata,
    } = req.body;

    const [updatedStub] = await db
      .update(systemStubs)
      .set({
        name,
        status,
        description,
        stubType,
        endpoint,
        mockData,
        responseExamples,
        latencyMs,
        errorScenarios,
        testResults,
        notes,
        metadata,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(systemStubs.id, req.params.stubId),
          eq(systemStubs.externalSystemId, req.params.id)
        )
      )
      .returning();

    if (!updatedStub) {
      return res.status(404).json({ error: 'System stub not found' });
    }

    res.json(updatedStub);
  } catch (error) {
    console.error('Error updating system stub:', error);
    res.status(500).json({ error: 'Failed to update system stub' });
  }
});

// DELETE /api/external-systems/:id/stubs/:stubId - Delete a stub
router.delete('/:id/stubs/:stubId', async (req, res) => {
  try {
    await db.delete(systemStubs).where(
      and(
        eq(systemStubs.id, req.params.stubId),
        eq(systemStubs.externalSystemId, req.params.id)
      )
    );
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting system stub:', error);
    res.status(500).json({ error: 'Failed to delete system stub' });
  }
});

// POST /api/external-systems/:id/stubs/:stubId/test - Test a stub
router.post('/:id/stubs/:stubId/test', async (req, res) => {
  try {
    const stub = await db.query.systemStubs.findFirst({
      where: and(
        eq(systemStubs.id, req.params.stubId),
        eq(systemStubs.externalSystemId, req.params.id)
      ),
    });

    if (!stub) {
      return res.status(404).json({ error: 'System stub not found' });
    }

    // Simulate testing the stub
    const testResult = {
      testId: `test-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'success',
      responseTime: stub.latencyMs || 100,
      mockDataReturned: true,
      errors: [],
    };

    // Update stub with test results
    const [updatedStub] = await db
      .update(systemStubs)
      .set({
        testResults: {
          ...stub.testResults as any,
          lastTest: testResult,
          testHistory: [
            testResult,
            ...((stub.testResults as any)?.testHistory || []).slice(0, 9),
          ],
        },
        updatedAt: new Date(),
      })
      .where(eq(systemStubs.id, req.params.stubId))
      .returning();

    res.json({
      stub: updatedStub,
      testResult,
    });
  } catch (error) {
    console.error('Error testing system stub:', error);
    res.status(500).json({ error: 'Failed to test system stub' });
  }
});

export default router;
