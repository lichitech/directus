import { useEnv as useBaseEnv } from '@directus/env';
import { tenantStorage } from '../multi-tenant.js';

/**
 * Returns the environment variables for the current tenant.
 *
 * @returns The environment variables for the current tenant.
 */
export function useEnv() {
	const tenantId = tenantStorage.getStore();
	return useBaseEnv(tenantId);
}
