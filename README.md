# Airline Agentic OS

A full-stack application for managing AI agents, workflows, and Model Context Protocols (MCPs) in airline operations.

## Tech Stack

### Backend
- **Runtime**: Node.js + Express
- **Language**: TypeScript
- **Database**: PostgreSQL (Railway)
- **ORM**: Drizzle ORM
- **API**: RESTful

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: Zustand + TanStack Query
- **Icons**: Lucide React

### Deployment
- **Platform**: Railway
- **Database**: Railway PostgreSQL

## Project Structure

```
airline-agentic-os/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.ts      # Drizzle ORM schema
│   │   │   ├── index.ts       # Database connection
│   │   │   └── seed.ts        # Seed data
│   │   ├── routes/
│   │   │   ├── domains.ts
│   │   │   ├── mcps.ts
│   │   │   ├── agents.ts
│   │   │   ├── workflows.ts
│   │   │   ├── tools.ts
│   │   │   └── cross-domain.ts
│   │   └── index.ts           # Express server
│   ├── package.json
│   └── drizzle.config.ts
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── lib/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── package.json               # Root workspace
└── railway.toml              # Railway config
```

## Database Schema

The application uses 12 main tables:

1. **domains** - Organizational domains (Flight Ops, Customer Service, etc.)
2. **subdomains** - Sub-areas within domains
3. **mcps** - Model Context Protocols with status tracking
4. **tools** - Individual tools within MCPs
5. **agent_categories** - Agent classification (Orchestrator, Specialist, etc.)
6. **agents** - AI agents with autonomy levels
7. **workflows** - Automated workflows with complexity ratings
8. **workflow_mcps** - Junction table for workflow-MCP relationships
9. **workflow_agents** - Junction table for workflow-agent relationships
10. **agent_collaborations** - Agent-to-agent relationships
11. **cross_domain_bridges** - Cross-domain connections
12. **mcp_dependencies** - MCP-to-MCP dependencies

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (Railway or local)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd airline-agentic-os
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

**Backend** (`backend/.env`):
```env
DATABASE_URL=postgresql://user:password@host:port/database
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3000
```

4. Generate and push database schema:
```bash
npm run db:generate
npm run db:push
```

5. Seed the database (optional):
```bash
npm run db:seed
```

### Running the Application

**Development mode** (both frontend and backend):
```bash
npm run dev
```

**Backend only**:
```bash
npm run backend
```

**Frontend only**:
```bash
npm run frontend
```

**Build for production**:
```bash
npm run build
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## API Endpoints

### Domains
- `GET /api/domains` - Get all domains
- `GET /api/domains/:id` - Get domain by ID
- `POST /api/domains` - Create domain
- `PUT /api/domains/:id` - Update domain
- `DELETE /api/domains/:id` - Delete domain

### MCPs
- `GET /api/mcps` - Get all MCPs
- `GET /api/mcps/:id` - Get MCP by ID
- `POST /api/mcps` - Create MCP
- `PUT /api/mcps/:id` - Update MCP
- `DELETE /api/mcps/:id` - Delete MCP

### Agents
- `GET /api/agents` - Get all agents
- `GET /api/agents/:id` - Get agent by ID
- `POST /api/agents` - Create agent
- `PUT /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent
- `GET /api/agents/categories/all` - Get all agent categories

### Workflows
- `GET /api/workflows` - Get all workflows
- `GET /api/workflows/:id` - Get workflow by ID
- `POST /api/workflows` - Create workflow
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow

### Tools
- `GET /api/tools` - Get all tools
- `GET /api/tools/:id` - Get tool by ID
- `POST /api/tools` - Create tool
- `PUT /api/tools/:id` - Update tool
- `DELETE /api/tools/:id` - Delete tool

### Cross-Domain
- `GET /api/cross-domain/bridges` - Get all bridges
- `GET /api/cross-domain/mcp-dependencies` - Get all MCP dependencies

## Database Management

### Generate migrations:
```bash
npm run db:generate
```

### Apply migrations:
```bash
npm run db:migrate
```

### Push schema to database:
```bash
npm run db:push
```

### Open Drizzle Studio (database GUI):
```bash
npm run db:studio
```

### Seed database with sample data:
```bash
npm run db:seed
```

## Deployment to Railway

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Create a new project:
```bash
railway init
```

4. Add PostgreSQL database:
```bash
railway add
```

5. Deploy:
```bash
railway up
```

6. Set environment variables in Railway dashboard

## Features

- Domain and subdomain management
- MCP (Model Context Protocol) tracking with status
- AI agent configuration with autonomy levels
- Workflow orchestration with complexity ratings
- Agent collaboration mapping
- Cross-domain bridge visualization
- MCP dependency tracking
- Real-time data with React Query
- Responsive UI with TailwindCSS

## License

MIT
