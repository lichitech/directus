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

export function useEnv() {
	return getEnvMap().get(getTenantID()) ?? {}
}

async function runAll(callback: () => unknown) {
	const tenantIDs = getEnvMap().keys();

	for (const tenantID of tenantIDs) {
		await envTenantStorage.run(tenantID, callback)
	}
}

export const useEnvTenant = {
	getEnvMap,
	getTenantID,
	run: envTenantStorage.run,
	runAll,
}
