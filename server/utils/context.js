import { AsyncLocalStorage } from 'async_hooks';

// This securely tracks the active Organization ID across all async operations for a single request
export const tenantContext = new AsyncLocalStorage();
