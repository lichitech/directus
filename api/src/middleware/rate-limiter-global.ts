import { useEnv, useEnvTenant } from '@directus/env';
import { HitRateLimitError } from '@directus/errors';
import type { RequestHandler } from 'express';
import type { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { useLogger } from '../logger/index.js';
import { createRateLimiter } from '../rate-limiter.js';
import asyncHandler from '../utils/async-handler.js';
import { validateEnv } from '../utils/validate-env.js';

const RATE_LIMITER_GLOBAL_KEY = 'global-rate-limit';

export const rateLimiterGlobalMap: Map<string, RateLimiterRedis | RateLimiterMemory> = new Map();

useEnvTenant.runAll(({ tenantID, env }) => {
	if (env['RATE_LIMITER_GLOBAL_ENABLED'] === true) {
		validateEnv(['RATE_LIMITER_GLOBAL_DURATION', 'RATE_LIMITER_GLOBAL_POINTS']);
		validateConfiguration();

		rateLimiterGlobalMap.set(tenantID, createRateLimiter('RATE_LIMITER_GLOBAL'))
	}
})

const checkRateLimit: RequestHandler = asyncHandler(
	async (_req, res, next) => {
		const env = useEnv();

		const tenantID = useEnvTenant.getTenantID()
		const rateLimiterGlobal = rateLimiterGlobalMap.get(tenantID)

		if (rateLimiterGlobal) {
			try {
				await rateLimiterGlobal.consume(RATE_LIMITER_GLOBAL_KEY, 1);
			} catch (rateLimiterRes: any) {
				if (rateLimiterRes instanceof Error) throw rateLimiterRes;

				res.set('Retry-After', String(Math.round(rateLimiterRes.msBeforeNext / 1000)));
				throw new HitRateLimitError({
					limit: +(env['RATE_LIMITER_GLOBAL_POINTS'] as string),
					reset: new Date(Date.now() + rateLimiterRes.msBeforeNext),
				});
			}
		}

		next();
	}
)

export default checkRateLimit;

function validateConfiguration() {
	const env = useEnv()
	const logger = useLogger();

	if (env['RATE_LIMITER_ENABLED'] !== true) {
		logger.error(`The IP based rate limiter needs to be enabled when using the global rate limiter.`);
		process.exit(1);
	}

	const globalPointsPerSec =
		Number(env['RATE_LIMITER_GLOBAL_POINTS']) / Math.max(Number(env['RATE_LIMITER_GLOBAL_DURATION']), 1);

	const regularPointsPerSec = Number(env['RATE_LIMITER_POINTS']) / Math.max(Number(env['RATE_LIMITER_DURATION']), 1);

	if (globalPointsPerSec <= regularPointsPerSec) {
		logger.error(`The global rate limiter needs to allow more requests per second than the IP based rate limiter.`);
		process.exit(1);
	}
}
