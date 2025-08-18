import { useEnvTenant } from '@directus/env';
import { constants } from '../constants.js';
import { getSchema } from '../utils/get-schema.js';
import { createTusServer } from '../services/tus/index.js';
import { scheduleSynchronizedJob, validateCron } from '../utils/schedule.js';

/**
 * Schedule the tus cleanup
 *
 * @returns Whether or not tus cleanup has been initialized
 */
export default async function schedule(): Promise<boolean> {
	if (!constants.RESUMABLE_UPLOADS.ENABLED) return false;
	const tenantId = useEnvTenant.getTenantID();

	if (validateCron(constants.RESUMABLE_UPLOADS.SCHEDULE)) {
		scheduleSynchronizedJob(`tus-cleanup:${tenantId}`, constants.RESUMABLE_UPLOADS.SCHEDULE, async () => {
			const [tusServer, cleanupServer] = await createTusServer({
				schema: await getSchema(),
			});

			await tusServer.cleanUpExpiredUploads();

			cleanupServer();
		});
	}

	return true;
}
