# Railway Deployment Guide

This guide walks you through deploying the Airline Agentic OS to Railway.

## Prerequisites

- Railway account (sign up at https://railway.app)
- Neo4j Aura account (sign up at https://neo4j.com/cloud/aura)
- Anthropic API key (get from https://console.anthropic.com)
- Git repository connected to GitHub

## Architecture Overview

The application consists of:
- **Backend**: Express.js API server (Node.js)
- **Frontend**: React SPA (served by backend in production)
- **PostgreSQL**: Relational database for structured data
- **Neo4j**: Graph database for relationship tracking
- **Claude AI**: AI-powered research and explanations

## Step 1: Create Railway Project

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository: `jbandu/airline-agentic-os`
5. Railway will automatically detect the configuration

## Step 2: Add PostgreSQL Database

1. In your Railway project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically:
   - Create a PostgreSQL instance
   - Generate a `DATABASE_URL` environment variable
   - Link it to your service

## Step 3: Set Up Neo4j Aura

1. Go to https://console.neo4j.io
2. Create a new instance:
   - Select "AuraDB Free" (or paid tier)
   - Choose a region close to your Railway deployment
   - Note the connection details
3. Copy the connection URI, username, and password

## Step 4: Configure Environment Variables

In your Railway service's **Variables** tab, add these variables:

### Required Variables

```bash
# Node Environment
NODE_ENV=production

# PostgreSQL (automatically provided by Railway)
DATABASE_URL=<automatically_set>

# Neo4j Connection
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-secure-password

# Claude AI
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

### Optional Variables

```bash
# CORS Configuration (if you have a custom domain)
CORS_ORIGIN=https://yourdomain.com

# Port (Railway sets this automatically)
PORT=3000

# Logging
LOG_LEVEL=info
```

## Step 5: Initial Deployment

1. Railway will automatically deploy after you push to your repository
2. Monitor the build logs in the Railway dashboard
3. Wait for the deployment to complete (typically 3-5 minutes)

## Step 6: Initialize Database Schema

After the first deployment:

1. Open the Railway service shell (click "Shell" in the service menu)
2. Run database migrations:
   ```bash
   npm run db:push
   ```
3. Optionally seed initial data:
   ```bash
   npm run db:seed
   ```

## Step 7: Verify Deployment

1. Open your Railway service URL (shown in the deployment dashboard)
2. Check the health endpoint: `https://your-service.railway.app/health`
3. Expected response:
   ```json
   {
     "status": "ok",
     "timestamp": "2024-12-04T12:00:00.000Z",
     "services": {
       "api": "operational",
       "database": "operational",
       "neo4j": "operational"
     }
   }
   ```

## Step 8: Set Up Custom Domain (Optional)

1. In Railway, go to your service's "Settings"
2. Click "Domains" → "Add Custom Domain"
3. Enter your domain name
4. Follow Railway's DNS configuration instructions
5. Update `CORS_ORIGIN` environment variable if needed

## Continuous Deployment

Railway automatically deploys on every push to your main branch:

1. Push changes to GitHub:
   ```bash
   git push origin main
   ```
2. Railway detects the push and starts building
3. Build process:
   - Installs dependencies
   - Builds backend (TypeScript → JavaScript)
   - Builds frontend (React → static files)
   - Starts the server
4. Health checks ensure the service is ready
5. Traffic switches to the new deployment

## Monitoring & Troubleshooting

### View Logs

1. In Railway dashboard, click your service
2. Select "Deployments" → Latest deployment
3. View real-time logs in the "Logs" tab

### Health Check Endpoint

Monitor service health:
```bash
curl https://your-service.railway.app/health
```

Response codes:
- `200`: All services operational
- `503`: Degraded (one or more services failing)

### Common Issues

#### Database Connection Failed

**Symptom**: `health.services.database: "error"`

**Solution**:
1. Verify `DATABASE_URL` is set correctly
2. Check PostgreSQL service is running in Railway
3. Ensure network connectivity between services

#### Neo4j Connection Failed

**Symptom**: `health.services.neo4j: "error"`

**Solution**:
1. Verify Neo4j Aura instance is running
2. Check `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD` are correct
3. Ensure Railway has network access to Neo4j Aura
4. Verify Neo4j Aura firewall allows Railway IP ranges

#### Build Failures

**Symptom**: Deployment fails during build

**Solution**:
1. Check build logs for specific error
2. Verify all dependencies are in `package.json`
3. Ensure TypeScript compiles locally: `npm run build`
4. Check Node.js version matches `engines` in `package.json`

#### Claude API Errors

**Symptom**: AI features not working

**Solution**:
1. Verify `ANTHROPIC_API_KEY` is set correctly
2. Check API key has sufficient credits
3. Review API rate limits at https://console.anthropic.com

## Scaling Considerations

### Vertical Scaling

Railway allows you to scale resources:
1. Go to service "Settings" → "Resources"
2. Increase vCPUs and memory as needed
3. Recommended for high traffic: 2+ vCPUs, 4GB+ RAM

### Database Optimization

For production workloads:
1. Upgrade PostgreSQL plan for better performance
2. Add read replicas if needed
3. Consider connection pooling (PgBouncer)

### Neo4j Optimization

For large graph datasets:
1. Upgrade to Neo4j Aura Professional
2. Enable graph data science algorithms
3. Optimize Cypher queries with indexes

## Backup & Recovery

### PostgreSQL Backups

Railway provides automatic daily backups:
1. Go to PostgreSQL service → "Backups"
2. Manual backup: Click "Create Backup"
3. Restore: Select backup → "Restore"

### Neo4j Backups

Neo4j Aura provides automatic backups:
1. Go to Neo4j Console → Your instance
2. "Backups" tab shows available backups
3. Follow Neo4j documentation for restore procedures

## Security Best Practices

1. **API Keys**: Never commit API keys to Git
2. **Environment Variables**: Use Railway's Variables feature
3. **CORS**: Set specific origins in production
4. **Rate Limiting**: Implement rate limiting for public endpoints
5. **Authentication**: Add authentication if exposing to internet
6. **HTTPS**: Railway provides automatic HTTPS with custom domains

## Cost Optimization

### Railway Costs

- **Starter Plan**: $5/month + usage
- **Free Tier**: Available with limitations
- **Pay-as-you-go**: Based on resource usage

### Neo4j Costs

- **AuraDB Free**: Limited storage and compute
- **AuraDB Professional**: Starts at $65/month
- Consider query optimization to reduce compute usage

### Claude AI Costs

- **Pay-per-use**: Based on tokens consumed
- Optimize prompts to reduce token usage
- Implement caching for repeated queries

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Neo4j Docs**: https://neo4j.com/docs
- **Anthropic Docs**: https://docs.anthropic.com
- **Project Issues**: https://github.com/jbandu/airline-agentic-os/issues

## Next Steps

After successful deployment:

1. **Set up monitoring**: Use Railway's metrics or integrate with external monitoring
2. **Configure alerts**: Set up notifications for service failures
3. **Review logs**: Regularly check logs for errors or warnings
4. **Optimize performance**: Monitor response times and optimize queries
5. **Scale as needed**: Adjust resources based on usage patterns

---

Generated for Airline Agentic OS v1.0.0
