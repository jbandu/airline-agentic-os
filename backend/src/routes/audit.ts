import { Router } from 'express';
import { AuditService } from '../services/audit.service';

const router = Router();

/**
 * GET /api/audit/entity/:entityType/:entityId
 * Get audit history for a specific entity
 *
 * Query params:
 *   - limit: number (default: 50, max: 200)
 *
 * Returns: Array of audit entries
 */
router.get('/entity/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    const history = await AuditService.getEntityHistory(entityType, entityId, limit);
    res.json(history);
  } catch (error: any) {
    console.error('Error fetching entity history:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch entity history' });
  }
});

/**
 * GET /api/audit/actor/:actor
 * Get audit history for a specific actor (user)
 *
 * Query params:
 *   - limit: number (default: 50, max: 200)
 *
 * Returns: Array of audit entries
 */
router.get('/actor/:actor', async (req, res) => {
  try {
    const { actor } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    const history = await AuditService.getActorHistory(actor, limit);
    res.json(history);
  } catch (error: any) {
    console.error('Error fetching actor history:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch actor history' });
  }
});

/**
 * GET /api/audit/action/:action
 * Get audit history for a specific action type
 *
 * Query params:
 *   - limit: number (default: 50, max: 200)
 *
 * Returns: Array of audit entries
 */
router.get('/action/:action', async (req, res) => {
  try {
    const { action } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    const validActions = ['create', 'update', 'delete', 'status_change', 'research_add'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        error: `Invalid action. Must be one of: ${validActions.join(', ')}`
      });
    }

    const history = await AuditService.getActionHistory(action as any, limit);
    res.json(history);
  } catch (error: any) {
    console.error('Error fetching action history:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch action history' });
  }
});

/**
 * GET /api/audit/recent
 * Get recent activity across all entities
 *
 * Query params:
 *   - limit: number (default: 50, max: 200)
 *
 * Returns: Array of audit entries
 */
router.get('/recent', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    const activity = await AuditService.getRecentActivity(limit);
    res.json(activity);
  } catch (error: any) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch recent activity' });
  }
});

/**
 * POST /api/audit/query
 * Advanced query with multiple filters
 *
 * Body:
 *   - entityType?: string
 *   - entityId?: string
 *   - actor?: string
 *   - action?: 'create' | 'update' | 'delete' | 'status_change' | 'research_add'
 *   - startDate?: string (ISO 8601)
 *   - endDate?: string (ISO 8601)
 *   - limit?: number (default: 50, max: 200)
 *   - offset?: number (default: 0)
 *
 * Returns: AuditHistoryResult with entries, totalCount, and hasMore
 */
router.post('/query', async (req, res) => {
  try {
    const { entityType, entityId, actor, action, startDate, endDate, limit, offset } = req.body;

    if (action) {
      const validActions = ['create', 'update', 'delete', 'status_change', 'research_add'];
      if (!validActions.includes(action)) {
        return res.status(400).json({
          error: `Invalid action. Must be one of: ${validActions.join(', ')}`
        });
      }
    }

    const options: any = {
      entityType,
      entityId,
      actor,
      action,
      limit: limit ? Math.min(limit, 200) : 50,
      offset: offset || 0,
    };

    if (startDate) {
      options.startDate = new Date(startDate);
    }

    if (endDate) {
      options.endDate = new Date(endDate);
    }

    const result = await AuditService.query(options);
    res.json(result);
  } catch (error: any) {
    console.error('Error querying audit log:', error);
    res.status(500).json({ error: error.message || 'Failed to query audit log' });
  }
});

/**
 * GET /api/audit/summary
 * Get activity summary for a date range
 *
 * Query params:
 *   - startDate: string (ISO 8601, required)
 *   - endDate: string (ISO 8601, required)
 *
 * Returns: Activity summary with aggregated statistics
 */
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Use ISO 8601 format.' });
    }

    const summary = await AuditService.getActivitySummary(start, end);
    res.json(summary);
  } catch (error: any) {
    console.error('Error fetching activity summary:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch activity summary' });
  }
});

/**
 * GET /api/audit/deletes
 * Get all deletes with dependency context
 *
 * Query params:
 *   - limit: number (default: 50, max: 200)
 *
 * Returns: Array of delete audit entries with dependency context
 */
router.get('/deletes', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    const deletes = await AuditService.getDeletesWithDependencies(limit);
    res.json(deletes);
  } catch (error: any) {
    console.error('Error fetching deletes with dependencies:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch deletes' });
  }
});

/**
 * GET /api/audit/timeline/:entityType/:entityId
 * Get change timeline for an entity (shows what changed when)
 *
 * Returns: Array of timeline entries with detailed change information
 */
router.get('/timeline/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    const timeline = await AuditService.getChangeTimeline(entityType, entityId);
    res.json(timeline);
  } catch (error: any) {
    console.error('Error fetching change timeline:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch change timeline' });
  }
});

/**
 * POST /api/audit/log
 * Manually log an audit entry (for testing or manual operations)
 *
 * Body:
 *   - entityType: string (required)
 *   - entityId: string (required)
 *   - entityName?: string
 *   - action: 'create' | 'update' | 'delete' | 'status_change' | 'research_add' (required)
 *   - actor: string (required)
 *   - reason?: string
 *   - previousState?: object
 *   - newState?: object
 *   - dependencyContext?: object
 *   - metadata?: object
 *
 * Returns: Success message
 */
router.post('/log', async (req, res) => {
  try {
    const { entityType, entityId, entityName, action, actor, reason, previousState, newState, dependencyContext, metadata } = req.body;

    if (!entityType || !entityId || !action || !actor) {
      return res.status(400).json({
        error: 'entityType, entityId, action, and actor are required'
      });
    }

    const validActions = ['create', 'update', 'delete', 'status_change', 'research_add'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        error: `Invalid action. Must be one of: ${validActions.join(', ')}`
      });
    }

    await AuditService.log({
      entityType,
      entityId,
      entityName,
      action,
      actor,
      reason,
      previousState,
      newState,
      dependencyContext,
      metadata,
    });

    res.json({ success: true, message: 'Audit entry logged successfully' });
  } catch (error: any) {
    console.error('Error logging audit entry:', error);
    res.status(500).json({ error: error.message || 'Failed to log audit entry' });
  }
});

export default router;
