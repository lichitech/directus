import type { Request, RequestHandler } from 'express';
import { useEnvTenant } from '@directus/env'
import { useLogger } from './logger/index.js';

const _cache = {
	hostTenantMap: new Map<string, string>()
} as const

function initHostTenantMap() {
	if (_cache.hostTenantMap.size > 0) return;

	useEnvTenant.runAll(({ env, tenantID }) => {
		const logger = useLogger()

		const publicURL = env['PUBLIC_URL']
		if (typeof publicURL !== 'string') return;

		try {
			const url = new URL(publicURL);
			if (url.hostname)
				_cache.hostTenantMap.set(url.hostname.toLowerCase(), tenantID);
		} catch (error) {
			logger.warn(`Get hostname from PUBLIC_URL "${publicURL}" failed, error: ${error}`)
		}
	});
}

function getTenantIdByHost(host: string) {
	initHostTenantMap();
	return _cache.hostTenantMap.get(host.toLowerCase())
}

function getTenantIdByHeader(req: Request) {
	return req.get('X-Tenant-ID')
}

/**
 * Middleware to identify and set the tenant ID for the request lifecycle.
 */
export const multiTenant: RequestHandler = async (req, _, next) => {
	const tenantId = getTenantIdByHeader(req) ?? getTenantIdByHost(req.hostname)

	if (tenantId) {
		useEnvTenant.run(tenantId, () => next());
	} else {
		next();
	}
};
