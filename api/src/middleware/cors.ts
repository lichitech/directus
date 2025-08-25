import { useEnv } from '@directus/env';
import cors from 'cors';
import type { RequestHandler } from 'express';

const corsMiddleware: RequestHandler = (req, resp, next) => {
	const env = useEnv();

	if (env['CORS_ENABLED'] === true) {
		const handler = cors({
			origin: env['CORS_ORIGIN'] as boolean | string,
			methods: env['CORS_METHODS'] as string,
			allowedHeaders: env['CORS_ALLOWED_HEADERS'] as string,
			exposedHeaders: env['CORS_EXPOSED_HEADERS'] as string,
			credentials: env['CORS_CREDENTIALS'] as boolean,
			maxAge: env['CORS_MAX_AGE'] as number,
		});

		handler(req, resp, next)
	} else {
		next()
	}
};

export default corsMiddleware;
