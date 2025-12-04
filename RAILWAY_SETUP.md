# Railway Deployment Setup Guide

## Current Status

✅ Build succeeds
✅ Health check passes
✅ App is deployed and running
✅ Database connected and seeded
✅ Frontend API configuration fixed
⚠️  **Action Required**: Remove invalid Neo4j environment variables (see below)

## Why No Data is Showing

The application requires PostgreSQL to store and display data (domains, MCPs, agents, workflows, etc.). Currently, the `DATABASE_URL` environment variable is either:
- Not set in Railway, OR
- Set but the database is empty (not seeded)

## Quick Fix - Get Data Showing

### Step 1: Add PostgreSQL to Railway

1. Open your Railway project dashboard
2. Click **"New"** → **"Database"** → **"Add PostgreSQL"**
3. Railway automatically creates and sets the `DATABASE_URL` variable
4. Your app will automatically redeploy

### Step 2: Seed the Database

After PostgreSQL is added, run this command locally to populate it with sample data:

```bash
# Get the DATABASE_URL from Railway dashboard (click on PostgreSQL service → Connect)
export DATABASE_URL="postgresql://postgres:..."

# Run the seed script
npm run db:seed -w backend
```

### Step 3: Verify

Visit your app - you should now see data! Check:
- https://your-app.railway.app (main dashboard)
- https://your-app.railway.app/health (should show `"database": "operational"`)
- https://your-app.railway.app/api/domains (should return data)

## Alternative: Run Migrations First

If you prefer to start with an empty database and add data manually:

```bash
# After adding PostgreSQL in Railway, run migrations:
export DATABASE_URL="postgresql://postgres:..."
npm run db:push -w backend
```

Then use the UI to create domains, MCPs, etc.

## Environment Variables

### Required
- `DATABASE_URL` - Auto-set when you add PostgreSQL
- `NODE_ENV` - Set to `production` (usually auto-set by Railway)
- `PORT` - Auto-set by Railway

### Optional
- `NEO4J_URI` - For graph/dependency visualization features
- `NEO4J_USER` - Neo4j username (default: neo4j)
- `NEO4J_PASSWORD` - Neo4j password
- `ANTHROPIC_API_KEY` - For AI-powered research features
- `CORS_ORIGIN` - Override CORS (defaults to `*`)

## Troubleshooting

### ⚠️ IMPORTANT: Remove Invalid Neo4j Variables

If you see Neo4j connection errors in Railway logs like:
```
Could not perform discovery. No routing servers available.
getaddrinfo ENOTFOUND 9a541f3d.databases.neo4j.io
```

**Problem**: Railway has invalid NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD variables set
**Solution**: Manually remove these from Railway dashboard:

1. Go to Railway dashboard → Your project
2. Click on your service (the deployed app)
3. Go to the **Variables** tab
4. Delete these variables:
   - `NEO4J_URI`
   - `NEO4J_USER`
   - `NEO4J_PASSWORD`
5. Railway will automatically redeploy

**Why**: The app works fine without Neo4j (it's optional). Invalid credentials cause error spam in logs. Remove them to clean up logs, or set valid Neo4j credentials if you want graph features.

### "Database not configured" in health check
**Problem**: `DATABASE_URL` not set
**Solution**: Add PostgreSQL database in Railway

### API returns empty arrays `[]`
**Problem**: Database connected but no data
**Solution**: Run `npm run db:seed -w backend` with DATABASE_URL

### Frontend shows "No data available"
**Problem**: Frontend was calling localhost instead of Railway backend
**Solution**: Fixed in commit 43475eb - rebuild and redeploy will fix this

### App crashes: "DATABASE_URL environment variable is not set"
**Problem**: PostgreSQL not added to Railway project
**Solution**: Add PostgreSQL service in Railway dashboard

## What the Seed Data Includes

The seed script (`backend/src/db/seed.ts`) creates:
- 8 airline business domains
- 40+ subdomains
- 150+ MCPs (Model Context Protocols)
- Agents, workflows, tools
- Sample personas and use cases
- Cross-domain dependencies

Perfect for testing and demonstration!

## Advanced: Neo4j Setup (Optional)

For graph-based dependency visualization:

1. Sign up at https://neo4j.com/cloud/aura/
2. Create a free instance
3. Add these variables in Railway:
   ```
   NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your-password
   ```
4. Sync data: `npm run db:neo4j:sync -w backend`

## Need Help?

Check the Railway logs:
```bash
# In Railway dashboard → Your service → Deployments → View logs
# Or if you have Railway CLI installed:
railway logs
```

Look for errors mentioning `DATABASE_URL` or connection failures.
