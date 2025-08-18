import { _cache, useEnv } from './use-env.js';
import { test, expect, vi, afterEach } from 'vitest';
import { createEnv } from './create-env.js';
import { ENV_TENANT_DEFAULT_KEY } from '../constants/multi-tenant.js';

vi.mock('./create-env.js');

afterEach(() => {
	vi.resetAllMocks();

	_cache.env = new Map();
});

test('Returns cached env if exists', () => {
	_cache.env = new Map([
		[ENV_TENANT_DEFAULT_KEY, {}]
	])

	const env = useEnv();

	expect(env).toBe(_cache.env.get(ENV_TENANT_DEFAULT_KEY));
});

test('Creates new cached env if not exists', () => {
	const mockEnv = { defaults: {}, tenants: new Map() };
	vi.mocked(createEnv).mockReturnValue(mockEnv);

	const env = useEnv();

	expect(env).toBe(mockEnv.defaults);

	expect(_cache.env).toStrictEqual(new Map([
		[ENV_TENANT_DEFAULT_KEY, {}]
	]));
});
