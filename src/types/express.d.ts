import { type UserContext } from "../infrastructure/http/index.js";

declare global {
  namespace Express {
    interface Request {
      user?: UserContext;
    }
  }
}
