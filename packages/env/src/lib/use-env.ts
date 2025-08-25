import { AsyncLocalStorage } from 'async_hooks';
import type { Env } from '../types/env.js';
import { createEnv } from './create-env.js';
import { ENV_TENANT_DEFAULT_KEY } from '../constants/multi-tenant.js';

// Using AsyncLocalStorage to safely carry tenant context through async operations
export const envTenantStorage = new AsyncLocalStorage<string>();

export const _cache: {
	env: Map<string, Env>;
} = { env: new Map() } as const;

function getTenantID() {
	return envTenantStorage.getStore()?.toLowerCase() ?? ENV_TENANT_DEFAULT_KEY;
}

function getEnvMap() {
	if (_cache.env.size == 0) {
		const envMap = createEnv();
		_cache.env.set(ENV_TENANT_DEFAULT_KEY, envMap.defaults)
		envMap.tenants.forEach((value, key) => _cache.env.set(key, value))
	}

	return _cache.env
}

export function useEnv(tenantID?: string) {
	return getEnvMap().get(tenantID ?? getTenantID()) ?? {}
}

type Context = { tenantID: string, env: Env }

async function runAll(
	callback: (context: Context) => unknown,
	context?: Context
) {
	for (const [tenantID, env] of getEnvMap()) {
		const _context = context ?? { tenantID, env }
		await envTenantStorage.run(tenantID, () => callback(_context))
	}
}

async function run(store: string, callback: () => unknown) {
	return envTenantStorage.run(store, callback);
}

export const useEnvTenant = { getTenantID, run, runAll, }
