import { useEnvTenant } from '@directus/env';
import { ExtensionManager } from './manager.js';

const extensionManagerMap: Map<string, ExtensionManager> = new Map();

export function getExtensionManager(): ExtensionManager {
	const tenantID = useEnvTenant.getTenantID()

	if (extensionManagerMap.has(tenantID)) {
		return extensionManagerMap.get(tenantID)!;
	}

	const manager = new ExtensionManager();
	extensionManagerMap.set(tenantID, manager);

	return manager;
}
