// Load environment variables FIRST - this MUST be the first import
import './env';

import express from 'express';
import cors from 'cors';
import path from 'path';

// Import routes
import domainsRouter from './routes/domains';
import mcpsRouter from './routes/mcps';
import agentsRouter from './routes/agents';
import workflowsRouter from './routes/workflows';
import toolsRouter from './routes/tools';
import crossDomainRouter from './routes/cross-domain';

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
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/domains', domainsRouter);
app.use('/api/mcps', mcpsRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/workflows', workflowsRouter);
app.use('/api/tools', toolsRouter);
app.use('/api/cross-domain', crossDomainRouter);

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
