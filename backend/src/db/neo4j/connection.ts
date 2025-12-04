import neo4j, { Driver, Session, auth } from 'neo4j-driver';
import * as dotenv from 'dotenv';

dotenv.config();

let driver: Driver | null = null;
let connectionAttempted = false;
let connectionFailed = false;

export async function getNeo4jDriver(): Promise<Driver> {
  if (driver) {
    return driver;
  }

  // If connection previously failed, don't keep retrying
  if (connectionFailed) {
    throw new Error('Neo4j is not available. Set NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD environment variables to enable graph features.');
  }

  // Check if Neo4j is configured (not using defaults)
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USER || 'neo4j';
  const password = process.env.NEO4J_PASSWORD;

  // Only try to connect if explicitly configured for production
  const isProduction = process.env.NODE_ENV === 'production';
  if (!uri || !password) {
    if (isProduction) {
      console.warn('⚠️  Neo4j not configured - graph features will be unavailable');
      console.warn('   Set NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD to enable graph visualization');
      connectionFailed = true;
      throw new Error('Neo4j is not configured');
    }
    // Use defaults for local development
    console.log('📊 Using Neo4j defaults for local development');
  }

  const finalUri = uri || 'bolt://localhost:7687';
  const finalPassword = password || 'dev_password';

  try {
    connectionAttempted = true;
    driver = neo4j.driver(finalUri, auth.basic(user, finalPassword), {
      maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
    });

    // Verify connectivity
    await driver.verifyConnectivity();
    console.log('✓ Neo4j connection established');

    return driver;
  } catch (error) {
    console.error('Failed to connect to Neo4j:', error);
    connectionFailed = true;
    driver = null;
    throw error;
  }
}

export async function getNeo4jSession(): Promise<Session> {
  const driverInstance = await getNeo4jDriver();
  return driverInstance.session();
}

export async function closeNeo4jDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
    console.log('✓ Neo4j connection closed');
  }
}

export async function checkNeo4jHealth(): Promise<boolean> {
  try {
    const driverInstance = await getNeo4jDriver();
    await driverInstance.verifyConnectivity();
    return true;
  } catch (error) {
    console.error('Neo4j health check failed:', error);
    return false;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await closeNeo4jDriver();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeNeo4jDriver();
  process.exit(0);
});
