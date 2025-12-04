import { Router } from 'express';
import { db } from '../db';
import { certifications, certificationHistory } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

// GET /api/certifications - Get all certifications with filters
router.get('/', async (req, res) => {
  try {
    const { entityType, entityId, certificationType, status } = req.query;

    let whereConditions: any[] = [];

    if (entityType) {
      whereConditions.push(eq(certifications.entityType, entityType as any));
    }
    if (entityId) {
      whereConditions.push(eq(certifications.entityId, entityId as string));
    }
    if (certificationType) {
      whereConditions.push(eq(certifications.certificationType, certificationType as any));
    }
    if (status) {
      whereConditions.push(eq(certifications.status, status as any));
    }

    const allCertifications = await db.query.certifications.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      with: {
        history: {
          orderBy: (history, { desc }) => [desc(history.createdAt)],
          limit: 5,
        },
      },
      orderBy: (certifications, { desc }) => [desc(certifications.updatedAt)],
    });

    res.json(allCertifications);
  } catch (error) {
    console.error('Error fetching certifications:', error);
    res.status(500).json({ error: 'Failed to fetch certifications' });
  }
});

// GET /api/certifications/:id - Get a single certification
router.get('/:id', async (req, res) => {
  try {
    const certification = await db.query.certifications.findFirst({
      where: eq(certifications.id, req.params.id),
      with: {
        history: {
          orderBy: (history, { desc }) => [desc(history.createdAt)],
        },
      },
    });

    if (!certification) {
      return res.status(404).json({ error: 'Certification not found' });
    }

    res.json(certification);
  } catch (error) {
    console.error('Error fetching certification:', error);
    res.status(500).json({ error: 'Failed to fetch certification' });
  }
});

// POST /api/certifications - Create a new certification
router.post('/', async (req, res) => {
  try {
    const {
      entityType,
      entityId,
      certificationType,
      status,
      certifiedBy,
      certificationDate,
      expirationDate,
      requirements,
      evidence,
      notes,
      metadata,
    } = req.body;

    if (!entityType || !entityId || !certificationType) {
      return res.status(400).json({
        error: 'entityType, entityId, and certificationType are required',
      });
    }

    const [newCertification] = await db
      .insert(certifications)
      .values({
        entityType,
        entityId,
        certificationType,
        status: status || 'pending',
        certifiedBy,
        certificationDate: certificationDate ? new Date(certificationDate) : null,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        requirements,
        evidence,
        notes,
        metadata,
      })
      .returning();

    // Create history entry
    await db.insert(certificationHistory).values({
      certificationId: newCertification.id,
      action: 'created',
      newStatus: newCertification.status,
      changedBy: certifiedBy || 'system',
      reason: 'Initial certification creation',
    });

    res.status(201).json(newCertification);
  } catch (error) {
    console.error('Error creating certification:', error);
    res.status(500).json({ error: 'Failed to create certification' });
  }
});

// PUT /api/certifications/:id - Update a certification
router.put('/:id', async (req, res) => {
  try {
    const {
      certificationType,
      certifiedBy,
      certificationDate,
      expirationDate,
      requirements,
      evidence,
      notes,
      metadata,
    } = req.body;

    const [updatedCertification] = await db
      .update(certifications)
      .set({
        certificationType,
        certifiedBy,
        certificationDate: certificationDate ? new Date(certificationDate) : undefined,
        expirationDate: expirationDate ? new Date(expirationDate) : undefined,
        requirements,
        evidence,
        notes,
        metadata,
        updatedAt: new Date(),
      })
      .where(eq(certifications.id, req.params.id))
      .returning();

    if (!updatedCertification) {
      return res.status(404).json({ error: 'Certification not found' });
    }

    // Create history entry
    await db.insert(certificationHistory).values({
      certificationId: updatedCertification.id,
      action: 'updated',
      changedBy: certifiedBy || 'system',
      reason: 'Certification details updated',
    });

    res.json(updatedCertification);
  } catch (error) {
    console.error('Error updating certification:', error);
    res.status(500).json({ error: 'Failed to update certification' });
  }
});

// PATCH /api/certifications/:id/status - Update certification status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, changedBy, reason } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    // Get current certification to track previous status
    const currentCert = await db.query.certifications.findFirst({
      where: eq(certifications.id, req.params.id),
    });

    if (!currentCert) {
      return res.status(404).json({ error: 'Certification not found' });
    }

    const [updatedCertification] = await db
      .update(certifications)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(certifications.id, req.params.id))
      .returning();

    // Create history entry for status change
    await db.insert(certificationHistory).values({
      certificationId: updatedCertification.id,
      action: 'status_changed',
      previousStatus: currentCert.status,
      newStatus: status,
      changedBy: changedBy || 'system',
      reason: reason || 'Status updated',
    });

    res.json(updatedCertification);
  } catch (error) {
    console.error('Error updating certification status:', error);
    res.status(500).json({ error: 'Failed to update certification status' });
  }
});

// DELETE /api/certifications/:id - Delete a certification
router.delete('/:id', async (req, res) => {
  try {
    await db.delete(certifications).where(eq(certifications.id, req.params.id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting certification:', error);
    res.status(500).json({ error: 'Failed to delete certification' });
  }
});

// GET /api/certifications/:id/history - Get certification history
router.get('/:id/history', async (req, res) => {
  try {
    const history = await db.query.certificationHistory.findMany({
      where: eq(certificationHistory.certificationId, req.params.id),
      orderBy: (history, { desc }) => [desc(history.createdAt)],
    });

    res.json(history);
  } catch (error) {
    console.error('Error fetching certification history:', error);
    res.status(500).json({ error: 'Failed to fetch certification history' });
  }
});

export default router;
