import { useEnv, useEnvTenant } from '@directus/env';
import { GraphQLSchema } from 'graphql';
import { LRUMap } from 'mnemonist';
import { useBus } from '../../bus/index.js';

const env = useEnv();
const bus = useBus();

const _cache = new LRUMap<string, GraphQLSchema | string>(Number(env['GRAPHQL_SCHEMA_CACHE_CAPACITY'] ?? 100));

export const cache = {
	get: (key: string) => {
		const tenantID = useEnvTenant.getTenantID()
		return _cache.get(`${tenantID}:${key}`)
	},
	set: (key: string, value: string | GraphQLSchema) => {
		const tenantID = useEnvTenant.getTenantID()
		_cache.set(`${tenantID}:${key}`, value)
	}
}

bus.subscribe('schemaChanged', () => {
	_cache.clear();
});
