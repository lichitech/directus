import { useEnvTenant, useEnv } from '@directus/env';
import { InvalidProviderConfigError } from '@directus/errors';
import { toArray } from '@directus/utils';
import type { AuthDriver } from './auth/auth.js';
import {
	LDAPAuthDriver,
	LocalAuthDriver,
	OAuth2AuthDriver,
	OpenIDAuthDriver,
	SAMLAuthDriver,
} from './auth/drivers/index.js';
import { DEFAULT_AUTH_PROVIDER } from './constants.js';
import getDatabase from './database/index.js';
import { useLogger } from './logger/index.js';
import type { AuthDriverOptions } from './types/index.js';
import { getConfigFromEnv } from './utils/get-config-from-env.js';
import { getSchema } from './utils/get-schema.js';

const tenantProviders = new Map<string, Map<string, AuthDriver>>();

export async function getAuthProvider(provider: string): Promise<AuthDriver> {
	const logger = useLogger();
	const tenantId = useEnvTenant.getTenantID();

	if (!tenantProviders.has(tenantId)) {
		await initializeProvidersForTenant(tenantId);
	}

	const providers = tenantProviders.get(tenantId)!;

	if (!providers.has(provider)) {
		logger.error(`Auth provider "${provider}" isn't configured or is disabled for this tenant.`);
		throw new InvalidProviderConfigError({ provider });
	}

	return providers.get(provider)!;
}

async function initializeProvidersForTenant(tenantId: string): Promise<void> {
	const env = useEnv();
	const logger = useLogger();
	const options: AuthDriverOptions = { knex: getDatabase(), schema: await getSchema() };

	const providers = new Map<string, AuthDriver>();
	tenantProviders.set(tenantId, providers);

	const providerNames = toArray(env['AUTH_PROVIDERS'] as string);

	// Register default provider if not disabled
	if (!env['AUTH_DISABLE_DEFAULT']) {
		const defaultProvider = getProviderInstance('local', options)!;
		providers.set(DEFAULT_AUTH_PROVIDER, defaultProvider);
	}

	if (!env['AUTH_PROVIDERS']) {
		return;
	}

	// Register configured providers
	providerNames.forEach((name: string) => {
		name = name.trim();

		if (name === DEFAULT_AUTH_PROVIDER) {
			logger.error(`Cannot override "${DEFAULT_AUTH_PROVIDER}" auth provider.`);
			process.exit(1);
		}

		const { driver, ...config } = getConfigFromEnv(`AUTH_${name.toUpperCase()}_`);

		if (!driver) {
			logger.warn(`Missing driver definition for "${name}" auth provider.`);
			return;
		}

		const provider = getProviderInstance(driver, options, { provider: name, ...config });

		if (!provider) {
			logger.warn(`Invalid "${driver}" auth driver.`);
			return;
		}

		providers.set(name, provider);
	});
}

function getProviderInstance(
	driver: string,
	options: AuthDriverOptions,
	config: Record<string, any> = {},
): AuthDriver | undefined {
	switch (driver) {
		case 'local':
			return new LocalAuthDriver(options, config);

		case 'oauth2':
			return new OAuth2AuthDriver(options, config);

		case 'openid':
			return new OpenIDAuthDriver(options, config);

		case 'ldap':
			return new LDAPAuthDriver(options, config);

		case 'saml':
			return new SAMLAuthDriver(options, config);
	}

	return undefined;
}
