import { Router } from 'express';
import { DependencyService } from '../services/dependency.service';
import * as neo4jQueries from '../db/neo4j/queries';

const router = Router();

/**
 * POST /api/dependencies/check-delete
 * Check if an entity can be deleted
 *
 * Body:
 *   - entityType: 'domain' | 'subdomain' | 'mcp' | 'tool' | 'agent' | 'workflow' | 'bridge'
 *   - entityId: string (UUID)
 *
 * Returns: DependencyCheckResult
 */
router.post('/check-delete', async (req, res) => {
  try {
    const { entityType, entityId } = req.body;

    if (!entityType || !entityId) {
      return res.status(400).json({ error: 'entityType and entityId are required' });
    }

    const validTypes = ['domain', 'subdomain', 'mcp', 'tool', 'agent', 'workflow', 'bridge'];
    if (!validTypes.includes(entityType)) {
      return res.status(400).json({ error: `Invalid entityType. Must be one of: ${validTypes.join(', ')}` });
    }

    const service = new DependencyService();
    const result = await service.checkDeleteAllowed(entityType as any, entityId);

    res.json(result);
  } catch (error: any) {
    console.error('Error checking delete allowed:', error);
    res.status(500).json({ error: error.message || 'Failed to check delete permission' });
  }
});

/**
 * POST /api/dependencies/check-edit
 * Check if an entity can be edited
 *
 * Body:
 *   - entityType: 'domain' | 'subdomain' | 'mcp' | 'tool' | 'agent' | 'workflow' | 'bridge'
 *   - entityId: string (UUID)
 *   - proposedChanges: object
 *
 * Returns: DependencyCheckResult
 */
router.post('/check-edit', async (req, res) => {
  try {
    const { entityType, entityId, proposedChanges } = req.body;

    if (!entityType || !entityId || !proposedChanges) {
      return res.status(400).json({ error: 'entityType, entityId, and proposedChanges are required' });
    }

    const validTypes = ['domain', 'subdomain', 'mcp', 'tool', 'agent', 'workflow', 'bridge'];
    if (!validTypes.includes(entityType)) {
      return res.status(400).json({ error: `Invalid entityType. Must be one of: ${validTypes.join(', ')}` });
    }

    const service = new DependencyService();
    const result = await service.checkEditAllowed(entityType as any, entityId, proposedChanges);

    res.json(result);
  } catch (error: any) {
    console.error('Error checking edit allowed:', error);
    res.status(500).json({ error: error.message || 'Failed to check edit permission' });
  }
});

/**
 * POST /api/dependencies/check-status-change
 * Check if an entity's status can be changed
 *
 * Body:
 *   - entityType: 'domain' | 'subdomain' | 'mcp' | 'tool' | 'agent' | 'workflow' | 'bridge'
 *   - entityId: string (UUID)
 *   - newStatus: string
 *
 * Returns: DependencyCheckResult
 */
router.post('/check-status-change', async (req, res) => {
  try {
    const { entityType, entityId, newStatus } = req.body;

    if (!entityType || !entityId || !newStatus) {
      return res.status(400).json({ error: 'entityType, entityId, and newStatus are required' });
    }

    const validTypes = ['domain', 'subdomain', 'mcp', 'tool', 'agent', 'workflow', 'bridge'];
    if (!validTypes.includes(entityType)) {
      return res.status(400).json({ error: `Invalid entityType. Must be one of: ${validTypes.join(', ')}` });
    }

    const service = new DependencyService();
    const result = await service.checkStatusChangeAllowed(entityType as any, entityId, newStatus);

    res.json(result);
  } catch (error: any) {
    console.error('Error checking status change allowed:', error);
    res.status(500).json({ error: error.message || 'Failed to check status change permission' });
  }
});

/**
 * POST /api/dependencies/proceed-with-soft-block
 * Override a soft block and proceed with action
 *
 * Body:
 *   - entityType: string
 *   - entityId: string
 *   - action: 'delete' | 'edit' | 'status_change'
 *   - actor: string
 *   - reason: string (mandatory)
 *   - proposedChanges?: object (for edit action)
 *
 * Returns: ActionResult
 */
router.post('/proceed-with-soft-block', async (req, res) => {
  try {
    const { entityType, entityId, action, actor, reason, proposedChanges } = req.body;

    if (!entityType || !entityId || !action || !actor || !reason) {
      return res.status(400).json({
        error: 'entityType, entityId, action, actor, and reason are required'
      });
    }

    const validActions = ['delete', 'edit', 'status_change'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        error: `Invalid action. Must be one of: ${validActions.join(', ')}`
      });
    }

    const service = new DependencyService();
    const result = await service.proceedWithSoftBlock(
      entityType as any,
      entityId,
      action as any,
      reason,
      actor
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    console.error('Error proceeding with soft block:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to proceed with soft block'
    });
  }
});

/**
 * GET /api/dependencies/graph/:entityType/:entityId
 * Get dependency graph for an entity
 *
 * Query params:
 *   - depth: number (default: 2, max: 5)
 *
 * Returns: GraphData
 */
router.get('/graph/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const depth = Math.min(parseInt(req.query.depth as string) || 2, 5);

    const validTypes = ['Domain', 'Subdomain', 'MCP', 'Tool', 'Agent', 'Workflow'];
    const capitalizedType = entityType.charAt(0).toUpperCase() + entityType.slice(1);

    if (!validTypes.includes(capitalizedType)) {
      return res.status(400).json({
        error: `Invalid entityType. Must be one of: ${validTypes.join(', ')}`
      });
    }

    const graph = await neo4jQueries.getDependencyGraph(capitalizedType, entityId, depth);
    res.json(graph);
  } catch (error: any) {
    console.error('Error fetching dependency graph:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch dependency graph' });
  }
});

/**
 * GET /api/dependencies/impact/delete/:entityType/:entityId
 * Analyze the impact of deleting an entity
 *
 * Returns: ImpactAnalysis
 */
router.get('/impact/delete/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    const validTypes = ['Domain', 'Subdomain', 'MCP', 'Tool', 'Agent', 'Workflow'];
    const capitalizedType = entityType.charAt(0).toUpperCase() + entityType.slice(1);

    if (!validTypes.includes(capitalizedType)) {
      return res.status(400).json({
        error: `Invalid entityType. Must be one of: ${validTypes.join(', ')}`
      });
    }

    const impact = await neo4jQueries.analyzeDeleteImpact(capitalizedType, entityId);
    res.json(impact);
  } catch (error: any) {
    console.error('Error analyzing delete impact:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze delete impact' });
  }
});

/**
 * POST /api/dependencies/impact/edit/:entityType/:entityId
 * Analyze the impact of editing an entity
 *
 * Body:
 *   - proposedChanges: object (required)
 *
 * Returns: ImpactAnalysis
 */
router.post('/impact/edit/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { proposedChanges } = req.body;

    if (!proposedChanges) {
      return res.status(400).json({ error: 'proposedChanges is required' });
    }

    const validTypes = ['Domain', 'Subdomain', 'MCP', 'Tool', 'Agent', 'Workflow'];
    const capitalizedType = entityType.charAt(0).toUpperCase() + entityType.slice(1);

    if (!validTypes.includes(capitalizedType)) {
      return res.status(400).json({
        error: `Invalid entityType. Must be one of: ${validTypes.join(', ')}`
      });
    }

    const impact = await neo4jQueries.analyzeEditImpact(capitalizedType, entityId, proposedChanges);
    res.json(impact);
  } catch (error: any) {
    console.error('Error analyzing edit impact:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze edit impact' });
  }
});

/**
 * GET /api/dependencies/downstream/:entityType/:entityId
 * Get downstream dependents of an entity
 *
 * Returns: DependencyChain
 */
router.get('/downstream/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    const validTypes = ['Domain', 'Subdomain', 'MCP', 'Tool', 'Agent', 'Workflow'];
    const capitalizedType = entityType.charAt(0).toUpperCase() + entityType.slice(1);

    if (!validTypes.includes(capitalizedType)) {
      return res.status(400).json({
        error: `Invalid entityType. Must be one of: ${validTypes.join(', ')}`
      });
    }

    const chain = await neo4jQueries.getDownstreamDependents(capitalizedType, entityId);
    res.json(chain);
  } catch (error: any) {
    console.error('Error fetching downstream dependents:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch downstream dependents' });
  }
});

/**
 * GET /api/dependencies/upstream/:entityType/:entityId
 * Get upstream dependencies of an entity
 *
 * Returns: DependencyChain
 */
router.get('/upstream/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    const validTypes = ['Domain', 'Subdomain', 'MCP', 'Tool', 'Agent', 'Workflow'];
    const capitalizedType = entityType.charAt(0).toUpperCase() + entityType.slice(1);

    if (!validTypes.includes(capitalizedType)) {
      return res.status(400).json({
        error: `Invalid entityType. Must be one of: ${validTypes.join(', ')}`
      });
    }

    const chain = await neo4jQueries.getUpstreamDependencies(capitalizedType, entityId);
    res.json(chain);
  } catch (error: any) {
    console.error('Error fetching upstream dependencies:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch upstream dependencies' });
  }
});

export default router;
