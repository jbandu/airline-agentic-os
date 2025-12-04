import { Router } from 'express';
import { db } from '../db';
import { domains, subdomains, mcps, tools, agents, workflows } from '../db/schema';
import { sql, eq, count } from 'drizzle-orm';

const router = Router();

// GET /api/stats/overview - Get total counts for all entities
router.get('/overview', async (req, res) => {
  try {
    const [
      domainsCount,
      subdomainsCount,
      mcpsCount,
      toolsCount,
      agentsCount,
      workflowsCount,
    ] = await Promise.all([
      db.select({ count: count() }).from(domains),
      db.select({ count: count() }).from(subdomains),
      db.select({ count: count() }).from(mcps),
      db.select({ count: count() }).from(tools),
      db.select({ count: count() }).from(agents),
      db.select({ count: count() }).from(workflows),
    ]);

    res.json({
      success: true,
      data: {
        domains: domainsCount[0].count,
        subdomains: subdomainsCount[0].count,
        mcps: mcpsCount[0].count,
        tools: toolsCount[0].count,
        agents: agentsCount[0].count,
        workflows: workflowsCount[0].count,
      },
    });
  } catch (error) {
    console.error('Error fetching overview stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch overview stats' });
  }
});

// GET /api/stats/build-progress - Get build progress percentages
router.get('/build-progress', async (req, res) => {
  try {
    const statusCounts = await db
      .select({
        status: tools.status,
        count: count(),
      })
      .from(tools)
      .groupBy(tools.status);

    const total = statusCounts.reduce((sum, item) => sum + item.count, 0);

    const progress = {
      built: 0,
      inProgress: 0,
      planned: 0,
      total,
    };

    statusCounts.forEach((item) => {
      if (item.status === 'built') progress.built = item.count;
      if (item.status === 'in-progress') progress.inProgress = item.count;
      if (item.status === 'planned') progress.planned = item.count;
    });

    const percentages = {
      built: total > 0 ? Math.round((progress.built / total) * 100) : 0,
      inProgress: total > 0 ? Math.round((progress.inProgress / total) * 100) : 0,
      planned: total > 0 ? Math.round((progress.planned / total) * 100) : 0,
    };

    res.json({
      success: true,
      data: {
        counts: progress,
        percentages,
      },
    });
  } catch (error) {
    console.error('Error fetching build progress:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch build progress' });
  }
});

// GET /api/stats/by-domain - Get stats grouped by domain
router.get('/by-domain', async (req, res) => {
  try {
    const allDomains = await db.query.domains.findMany({
      with: {
        subdomains: {
          with: {
            mcps: {
              with: {
                tools: true,
              },
            },
          },
        },
      },
    });

    const domainStats = allDomains.map((domain) => {
      const mcpsInDomain = domain.subdomains.flatMap((sd) => sd.mcps);
      const toolsInDomain = mcpsInDomain.flatMap((mcp) => mcp.tools);

      const toolsByStatus = {
        built: toolsInDomain.filter((t) => t.status === 'built').length,
        inProgress: toolsInDomain.filter((t) => t.status === 'in-progress').length,
        planned: toolsInDomain.filter((t) => t.status === 'planned').length,
      };

      return {
        id: domain.id,
        name: domain.name,
        icon: domain.icon,
        color: domain.color,
        subdomainCount: domain.subdomains.length,
        mcpCount: mcpsInDomain.length,
        toolCount: toolsInDomain.length,
        toolsByStatus,
      };
    });

    res.json({ success: true, data: domainStats });
  } catch (error) {
    console.error('Error fetching domain stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch domain stats' });
  }
});

// GET /api/stats/mcp-status - Get MCP status distribution
router.get('/mcp-status', async (req, res) => {
  try {
    const statusCounts = await db
      .select({
        status: mcps.status,
        count: count(),
      })
      .from(mcps)
      .groupBy(mcps.status);

    const total = statusCounts.reduce((sum, item) => sum + item.count, 0);

    const distribution = {
      built: 0,
      inProgress: 0,
      planned: 0,
      total,
    };

    statusCounts.forEach((item) => {
      if (item.status === 'built') distribution.built = item.count;
      if (item.status === 'in-progress') distribution.inProgress = item.count;
      if (item.status === 'planned') distribution.planned = item.count;
    });

    res.json({ success: true, data: distribution });
  } catch (error) {
    console.error('Error fetching MCP status:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch MCP status' });
  }
});

// GET /api/stats/timeline - Get MCPs grouped by target quarter
router.get('/timeline', async (req, res) => {
  try {
    const allMcps = await db.query.mcps.findMany({
      with: {
        subdomain: {
          with: {
            domain: true,
          },
        },
        tools: true,
      },
      orderBy: (mcps, { asc }) => [asc(mcps.targetQuarter)],
    });

    // Group by target quarter
    const byQuarter: Record<string, any[]> = {};

    allMcps.forEach((mcp) => {
      const quarter = mcp.targetQuarter || 'Unscheduled';
      if (!byQuarter[quarter]) {
        byQuarter[quarter] = [];
      }
      byQuarter[quarter].push({
        id: mcp.id,
        name: mcp.name,
        description: mcp.description,
        status: mcp.status,
        subdomain: mcp.subdomain.name,
        domain: mcp.subdomain.domain.name,
        domainColor: mcp.subdomain.domain.color,
        toolCount: mcp.tools.length,
        toolsByStatus: {
          built: mcp.tools.filter((t) => t.status === 'built').length,
          inProgress: mcp.tools.filter((t) => t.status === 'in-progress').length,
          planned: mcp.tools.filter((t) => t.status === 'planned').length,
        },
      });
    });

    res.json({ success: true, data: byQuarter });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch timeline' });
  }
});

// GET /api/stats/agent-categories - Get agent counts by category
router.get('/agent-categories', async (req, res) => {
  try {
    const allAgents = await db.query.agents.findMany({
      with: {
        category: true,
      },
    });

    const byCategory: Record<string, any> = {};

    allAgents.forEach((agent) => {
      const categoryCode = agent.category.code;
      if (!byCategory[categoryCode]) {
        byCategory[categoryCode] = {
          code: agent.category.code,
          name: agent.category.name,
          icon: agent.category.icon,
          color: agent.category.color,
          count: 0,
          agents: [],
        };
      }
      byCategory[categoryCode].count++;
      byCategory[categoryCode].agents.push({
        id: agent.id,
        name: agent.name,
        autonomyLevel: agent.autonomyLevel,
      });
    });

    res.json({ success: true, data: Object.values(byCategory) });
  } catch (error) {
    console.error('Error fetching agent categories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch agent categories' });
  }
});

export default router;
