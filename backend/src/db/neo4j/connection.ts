import neo4j, { Driver, Session, auth } from 'neo4j-driver';
import * as dotenv from 'dotenv';

dotenv.config();

let driver: Driver | null = null;

export async function getNeo4jDriver(): Promise<Driver> {
  if (driver) {
    return driver;
  }

  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const user = process.env.NEO4J_USER || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || 'dev_password';

  try {
    driver = neo4j.driver(uri, auth.basic(user, password), {
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
