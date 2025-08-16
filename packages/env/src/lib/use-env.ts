import type { Env } from '../types/env.js';
import { createEnv } from './create-env.js';

export const _cache: {
	env: { defaults: Env, tenants: Map<string, Env> } | undefined;
} = { env: undefined } as const;

export const useEnv = (tenantId?: string): Env => {
	if (!_cache.env) _cache.env = createEnv();

	return tenantId
		? _cache.env.tenants.get(tenantId.toLowerCase())!
		: _cache.env.defaults
};

export function useEnvMap() {
	if (!_cache.env) _cache.env = createEnv();
	return _cache.env;
}
