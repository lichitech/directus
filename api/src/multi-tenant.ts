import { AsyncLocalStorage } from 'async_hooks';
import type { RequestHandler } from 'express';
import { useEnvMap } from '@directus/env'
import { useLogger } from './logger/index.js';

const _cache = {
	hostTenantMap: new Map<string, string>()
} as const

// Using AsyncLocalStorage to safely carry tenant context through async operations
export const tenantStorage = new AsyncLocalStorage<string>();

function initHostTenantMap() {
	if (_cache.hostTenantMap.size !== 0) return;

	const logger = useLogger()
	const envMap = useEnvMap()

	if (envMap.tenants) {
		envMap.tenants.forEach((configuration, tenantId) => {
			const publicURL = configuration['PUBLIC_URL']
			if (typeof publicURL !== 'string') return;

			try {
				const url = new URL(publicURL);
				if (url.hostname)
					_cache.hostTenantMap.set(url.hostname.toLowerCase(), tenantId);
			} catch (error) {
				if (error instanceof TypeError)
					logger.warn(`Get hostname from PUBLIC_URL "${publicURL}" failed`)
				throw error
			}
		});
	}
}

export function getAllTenants() {
	initHostTenantMap();
	return new Set(_cache.hostTenantMap.values());
}

function getTenantIdByHost(host: string) {
	initHostTenantMap();
	return _cache.hostTenantMap.get(host.toLowerCase())
}

/**
 * Middleware to identify and set the tenant ID for the request lifecycle.
 */
export const multiTenant: RequestHandler = async (req, _, next) => {
	const tenantId = getTenantIdByHost(req.hostname)

	if (tenantId) {
		tenantStorage.run(tenantId, () => next());
	} else {
		next();
	}
};
