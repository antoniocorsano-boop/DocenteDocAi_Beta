import { FullConfig } from '@playwright/test';

async function globalSetup(_config: FullConfig): Promise<void> {
  console.log('E2E global setup complete');
}

export default globalSetup;
