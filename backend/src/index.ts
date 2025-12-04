// Load environment variables FIRST - this MUST be the first import
import './env';

import express from 'express';
import cors from 'cors';

// Import routes
import domainsRouter from './routes/domains';
import mcpsRouter from './routes/mcps';
import agentsRouter from './routes/agents';
import workflowsRouter from './routes/workflows';
import toolsRouter from './routes/tools';
import crossDomainRouter from './routes/cross-domain';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Root endpoint
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

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
