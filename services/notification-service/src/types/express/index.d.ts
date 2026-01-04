import type { Auth0JwtPayload } from "express-oauth2-jwt-bearer";

declare global {
    namespace Express {
        interface Request {
            auth?: {
                payload: Auth0JwtPayload;
            };
        }
    }
}