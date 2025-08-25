import { useEnv, useEnvTenant } from '@directus/env';
import { HitRateLimitError } from '@directus/errors';
import type { RequestHandler } from 'express';
import type { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { createRateLimiter } from '../rate-limiter.js';
import asyncHandler from '../utils/async-handler.js';
import { getIPFromReq } from '../utils/get-ip-from-req.js';
import { validateEnv } from '../utils/validate-env.js';

export const rateLimiterMap: Map<string, RateLimiterRedis | RateLimiterMemory> = new Map();

useEnvTenant.runAll(({ tenantID, env }) => {
	if (env['RATE_LIMITER_ENABLED'] === true) {
		validateEnv(['RATE_LIMITER_STORE', 'RATE_LIMITER_DURATION', 'RATE_LIMITER_POINTS']);
		rateLimiterMap.set(tenantID, createRateLimiter('RATE_LIMITER'))
	}
})

const checkRateLimit: RequestHandler = asyncHandler(
	async (req, res, next) => {
		const env = useEnv();

		const tenantID = useEnvTenant.getTenantID()
		const rateLimiter = rateLimiterMap.get(tenantID)

		if (rateLimiter) {
			const ip = getIPFromReq(req);

			if (ip) {
				try {
					await rateLimiter.consume(ip, 1);
				} catch (rateLimiterRes: any) {
					if (rateLimiterRes instanceof Error) throw rateLimiterRes;

					res.set('Retry-After', String(Math.round(rateLimiterRes.msBeforeNext / 1000)));
					throw new HitRateLimitError({
						limit: +(env['RATE_LIMITER_POINTS'] as string),
						reset: new Date(Date.now() + rateLimiterRes.msBeforeNext),
					});
				}
			}
		}

		next()
	}
);

export default checkRateLimit;
