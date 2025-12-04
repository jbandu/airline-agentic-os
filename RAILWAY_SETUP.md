# Railway Production Setup

Quick guide to get your Railway deployment fully operational with data.

## Issue: Blank Graph / No Data

If you're seeing a blank graph or "No Data Available" message, it's because the production database hasn't been seeded yet.

## Solution: Seed the Production Database

### Option 1: Using Railway Shell (Recommended)

1. Open your Railway project dashboard
2. Click on your service (airline-agentic-os)
3. Click the "Shell" tab (or "Terminal")
4. Run the following commands:

```bash
# Push database schema
npm run db:push

# Seed initial data
npm run db:seed
```

5. Refresh your browser - you should now see data in the graph!

### Option 2: Using Railway CLI

If you have the Railway CLI installed:

```bash
# Login to Railway
railway login

# Link to your project
railway link

# Run seed command
railway run npm run db:seed
```

### Option 3: Manual Database Connection

1. Get your DATABASE_URL from Railway dashboard (Variables tab)
2. Run locally with production database:

```bash
# Set production DATABASE_URL
export DATABASE_URL="your-railway-postgres-url"

# Run seed
npm run db:seed
```

## What Gets Seeded

The seed script creates:

- **3 Domains**:
  - Flight Operations (✈️)
  - Ground Operations (🚚)
  - Customer Experience (👤)

- **9 Subdomains**:
  - Crew Management, Flight Planning, Real-time Ops
  - Baggage, Catering, Maintenance
  - Booking, Check-in, Loyalty

- **27 MCPs**: Distributed across subdomains with various statuses

- **Cross-Domain Bridges**: Relationships between subdomains

## Verify Setup

After seeding, check:

1. **Dashboard**: Visit `/` - should show stats (domains, MCPs)
2. **Domains Page**: Visit `/domains` - should show 3 domain cards
3. **MCPs Page**: Visit `/mcps` - should show 27 MCPs
4. **Graph**: Should show force-directed visualization with all entities

## Health Check

Visit `/health` endpoint to verify all services:

```bash
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-12-04T...",
  "services": {
    "api": "operational",
    "database": "operational",
    "neo4j": "operational"
  }
}
```

If Neo4j shows "error", make sure you've:
1. Created a Neo4j Aura instance
2. Added NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD to Railway variables
3. Redeployed the service

## Sync Neo4j Graph

After seeding PostgreSQL, sync the graph database:

```bash
# In Railway shell
npm run db:neo4j:sync
```

This creates nodes and relationships in Neo4j for the dependency engine.

## Troubleshooting

### Graph Still Blank After Seeding

1. Check browser console for errors (F12)
2. Verify API is responding: `curl https://your-app.railway.app/api/domains`
3. Check CORS settings (CORS_ORIGIN environment variable)
4. Clear browser cache and refresh

### Database Connection Errors

1. Verify DATABASE_URL is set in Railway variables
2. Check PostgreSQL service is running
3. Restart the service if needed

### Neo4j Connection Errors

1. Verify Neo4j Aura instance is running
2. Check credentials are correct
3. Verify Railway can connect to Neo4j Aura (check firewall rules)

## Common Commands

```bash
# View logs
railway logs

# Restart service
railway up --detach

# Run migrations
railway run npm run db:push

# Seed database
railway run npm run db:seed

# Sync Neo4j
railway run npm run db:neo4j:sync

# Check health
curl https://your-app.railway.app/health
```

## Next Steps

Once data is loaded:

1. Explore the ecosystem graph visualization
2. Try the AI research feature on a domain
3. Test dependency checking by trying to delete a domain
4. Review the audit logs

---

For more detailed deployment information, see [DEPLOYMENT.md](./DEPLOYMENT.md).
