import { readFileSync } from 'node:fs';
import { DEFAULTS } from '../constants/defaults.js';
import type { Env } from '../types/env.js';
import { getConfigPath } from '../utils/get-config-path.js';
import { getDefaultType } from '../utils/get-default-type.js';
import { isDirectusVariable } from '../utils/is-directus-variable.js';
import { isFileKey } from '../utils/is-file-key.js';
import { readConfigurationFromProcess } from '../utils/read-configuration-from-process.js';
import { removeFileSuffix } from '../utils/remove-file-suffix.js';
import { cast } from './cast.js';
import { readConfigurationFromFile } from './read-configuration-from-file.js';
import { getCastFlag } from '../utils/has-cast-prefix.js';
import { ENV_TENANT_REGEX } from '../constants/multi-tenant.js';

export const createEnv = (): { defaults: Env, tenants: Map<string, Env> } => {
	const baseConfiguration = readConfigurationFromProcess();
	const fileConfiguration = readConfigurationFromFile(getConfigPath());
	const rawConfiguration = { ...baseConfiguration, ...fileConfiguration };

	const tenantRawConfigurationMap = new Map<string, Env>()

	for (const [key, value] of Object.entries(rawConfiguration)) {
		const found = key.match(ENV_TENANT_REGEX)
		if (!found || !found.groups) continue

		delete rawConfiguration[key];

		const tenantId = found.groups['id']?.toLowerCase()
		const tenantKey = found.groups['key']
		if (!tenantId || !tenantKey) continue

		const configuration = tenantRawConfigurationMap.get(tenantId) ?? {}
		configuration[tenantKey] = value
		tenantRawConfigurationMap.set(tenantId, configuration)
	}

	const defaults = parseEnv(rawConfiguration);

	const tenants = new Map<string, Env>()

	tenantRawConfigurationMap.forEach((configuration, tenantId) => {
		const tenantConfiguration = { ...rawConfiguration, ...configuration }
		tenants.set(tenantId, parseEnv(tenantConfiguration));
	})

	return { defaults, tenants }
};

function parseEnv(configuration: Env) {
	const output: Env = {};

	for (const [key, value] of Object.entries(DEFAULTS)) {
		output[key] = getDefaultType(key) ? cast(value, key) : value;
	}

	for (let [key, value] of Object.entries(configuration)) {
		if (isFileKey(key) && isDirectusVariable(key) && typeof value === 'string') {
			try {
				// get the path to the file
				const castFlag = getCastFlag(value);
				const castPrefix = castFlag ? castFlag + ':' : '';
				const filePath = castFlag ? value.replace(castPrefix, '') : value;

				// read file content
				const fileContent = readFileSync(filePath, { encoding: 'utf8' });

				// override key value pair
				key = removeFileSuffix(key);
				value = castPrefix + fileContent;
			} catch {
				throw new Error(`Failed to read value from file "${value}", defined in environment variable "${key}".`);
			}
		}

		output[key] = cast(value, key);
	}

	return output
}

