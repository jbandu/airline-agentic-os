// Load environment variables FIRST - this MUST be the first import
import './env';

import express from 'express';
import cors from 'cors';
import path from 'path';

// Import routes
import domainsRouter from './routes/domains';
import subdomainsRouter from './routes/subdomains';
import mcpsRouter from './routes/mcps';
import agentsRouter from './routes/agents';
import workflowsRouter from './routes/workflows';
import toolsRouter from './routes/tools';
import crossDomainRouter from './routes/cross-domain';
import statsRouter from './routes/stats';
import dependenciesRouter from './routes/dependencies';
import auditRouter from './routes/audit';
import personasRouter from './routes/personas';
import useCasesRouter from './routes/use-cases';
import certificationsRouter from './routes/certifications';
import externalSystemsRouter from './routes/external-systems';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend build in production
if (isProduction) {
  const frontendBuildPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendBuildPath));
}

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      api: 'operational',
      database: 'unknown',
      neo4j: 'unknown',
    },
  };

  try {
    // Check PostgreSQL connection
    const { db } = await import('./db');
    await db.execute('SELECT 1' as any);
    health.services.database = 'operational';
  } catch (error) {
    health.services.database = 'not_configured';
  }

  try {
    // Check Neo4j connection
    const { getNeo4jDriver } = await import('./db/neo4j/connection');
    const driver = await getNeo4jDriver();
    const session = driver.session();
    await session.run('RETURN 1');
    await session.close();
    health.services.neo4j = 'operational';
  } catch (error) {
    health.services.neo4j = 'not_configured';
  }

  // Always return 200 if API is responding, even if databases aren't configured
  res.status(200).json(health);
});

// API Routes
app.use('/api/domains', domainsRouter);
app.use('/api/subdomains', subdomainsRouter);
app.use('/api/mcps', mcpsRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/workflows', workflowsRouter);
app.use('/api/tools', toolsRouter);
app.use('/api/cross-domain', crossDomainRouter);
app.use('/api/stats', statsRouter);
app.use('/api/dependencies', dependenciesRouter);
app.use('/api/audit', auditRouter);
app.use('/api/personas', personasRouter);
app.use('/api/use-cases', useCasesRouter);
app.use('/api/certifications', certificationsRouter);
app.use('/api/external-systems', externalSystemsRouter);

// Root endpoint - API info in development, serve frontend in production
if (!isProduction) {
  app.get('/', (req, res) => {
    res.json({
      message: 'Airline Agentic OS API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        domains: '/api/domains',
        mcps: '/api/mcps',
        agents: '/api/agents',
        workflows: '/api/workflows',
        tools: '/api/tools',
        crossDomain: '/api/cross-domain',
        dependencies: '/api/dependencies',
        audit: '/api/audit',
        personas: '/api/personas',
        useCases: '/api/use-cases',
      },
    });
  });
}

// Serve frontend for all other routes in production (SPA support)
if (isProduction) {
  app.get('*', (req, res) => {
    const frontendIndexPath = path.join(__dirname, '../../frontend/dist/index.html');
    res.sendFile(frontendIndexPath);
  });
} else {
  // 404 handler for development
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
const HOST = '0.0.0.0'; // Bind to all interfaces for Railway
app.listen(PORT, HOST, () => {
  console.log(`Server is running on ${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API available at http://localhost:${PORT}`);
});

export default app;
