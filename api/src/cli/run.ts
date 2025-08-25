import { shutdownTenantDBs } from '../database/index.js';
import { useEnvTenant } from '@directus/env';
import { createCli } from './index.js';

createCli()
	.then(async (program) => {
		const options = program.opts();

		if (options['tenant']) {
			await useEnvTenant.run(options['tenant'], async () => {
				await program.parseAsync(process.argv);
			});
		} else {
			await program.parseAsync(process.argv);
		}
	})
	.catch((err) => {
		// eslint-disable-next-line no-console
		console.error(err);
		process.exit(1);
	})
	.finally(async () => {
		await shutdownTenantDBs();
	});
