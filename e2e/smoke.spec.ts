import { test, expect } from '@playwright/test';

test.describe('Airline Agentic OS - Smoke Tests', () => {
  test('should load the application and redirect to dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Airline Agentic OS')).toBeVisible();
  });

  test('Dashboard page - should display all stats and content', async ({ page }) => {
    await page.goto('/dashboard');

    // Check page title
    await expect(page.locator('h1')).toHaveText('Dashboard');

    // Check stats cards are visible
    await expect(page.getByRole('main').getByText('Domains').first()).toBeVisible();
    await expect(page.getByRole('main').getByText('MCPs').first()).toBeVisible();
    await expect(page.getByRole('main').getByText('Agents').first()).toBeVisible();
    await expect(page.getByRole('main').getByText('Workflows').first()).toBeVisible();

    // Check MCP Status section
    await expect(page.locator('text=MCP Status')).toBeVisible();
    await expect(page.locator('text=Built')).toBeVisible();
    await expect(page.locator('text=In Progress')).toBeVisible();
    await expect(page.locator('text=Planned')).toBeVisible();

    // Check Agent Status section
    await expect(page.locator('text=Agent Status')).toBeVisible();
    await expect(page.locator('text=Active Agents').first()).toBeVisible();
  });

  test('Domains page - should display domains list', async ({ page }) => {
    await page.goto('/domains');

    // Check page title
    await expect(page.locator('h1')).toHaveText('Domains');

    // Check description
    await expect(page.locator('text=Manage your organizational domains and subdomains')).toBeVisible();

    // Wait for data to load and check for domain cards
    await page.waitForTimeout(1000);

    // Check if domain cards are present (they should be loaded from seeded data)
    const domainCards = page.locator('div').filter({ hasText: /Flight Operations|Customer Service|Aircraft Maintenance/ });
    await expect(domainCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('MCPs page - should display MCPs list', async ({ page }) => {
    await page.goto('/mcps');

    // Check page title
    await expect(page.locator('h1')).toHaveText('Model Context Protocols (MCPs)');

    // Check description
    await expect(page.locator('text=Manage your AI-powered context protocols and tools')).toBeVisible();

    // Wait for data to load
    await page.waitForTimeout(1000);

    // Check for MCP items (from seeded data)
    const mcpList = page.locator('text=Baggage Tracking MCP');
    await expect(mcpList.first()).toBeVisible({ timeout: 5000 });
  });

  test('Agents page - should display agents list', async ({ page }) => {
    await page.goto('/agents');

    // Check page title
    await expect(page.locator('h1')).toHaveText('Agents');

    // Check description
    await expect(page.locator('text=Manage your AI agents and their configurations')).toBeVisible();

    // Wait for data to load
    await page.waitForTimeout(1000);

    // Check for agent cards (from seeded data)
    const agentCard = page.locator('text=Baggage Operations Agent');
    await expect(agentCard.first()).toBeVisible({ timeout: 5000 });

    // Check for agent status badges
    await expect(page.locator('text=Active').first()).toBeVisible();
  });

  test('Workflows page - should display workflows list', async ({ page }) => {
    await page.goto('/workflows');

    // Check page title
    await expect(page.locator('h1')).toHaveText('Workflows');

    // Check description
    await expect(page.locator('text=Manage automated workflows and their execution')).toBeVisible();

    // Wait for data to load
    await page.waitForTimeout(1000);

    // Check for workflow items (from seeded data)
    const workflowCard = page.locator('text=Proactive Baggage Mishandling Prevention');
    await expect(workflowCard.first()).toBeVisible({ timeout: 5000 });

    // Check for complexity indicators
    await expect(page.locator('text=Complexity').first()).toBeVisible();
    await expect(page.locator('text=Agentic Potential').first()).toBeVisible();
  });

  test('Navigation - should be able to navigate between all pages', async ({ page }) => {
    await page.goto('/dashboard');

    // Navigate to Domains
    await page.click('text=Domains');
    await expect(page).toHaveURL(/.*domains/);
    await expect(page.locator('h1')).toHaveText('Domains');

    // Navigate to MCPs
    await page.click('text=MCPs');
    await expect(page).toHaveURL(/.*mcps/);
    await expect(page.locator('h1')).toHaveText('Model Context Protocols (MCPs)');

    // Navigate to Agents
    await page.click('text=Agents');
    await expect(page).toHaveURL(/.*agents/);
    await expect(page.locator('h1')).toHaveText('Agents');

    // Navigate to Workflows
    await page.click('text=Workflows');
    await expect(page).toHaveURL(/.*workflows/);
    await expect(page.locator('h1')).toHaveText('Workflows');

    // Navigate back to Dashboard
    await page.click('text=Dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1')).toHaveText('Dashboard');
  });

  test('Backend API - health check endpoint should be accessible', async ({ request }) => {
    const response = await request.get('http://localhost:3000/health');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data).toHaveProperty('timestamp');
  });

  test('Backend API - domains endpoint should return data', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/domains');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
  });

  test('Backend API - mcps endpoint should return data', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/mcps');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
  });

  test('Backend API - agents endpoint should return data', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/agents');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
  });

  test('Backend API - workflows endpoint should return data', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/workflows');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
  });
});
