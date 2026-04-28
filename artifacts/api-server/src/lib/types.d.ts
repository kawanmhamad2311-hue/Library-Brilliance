import { User } from "@workspace/db";

declare global {
  namespace Express {
    interface Request {
      user: User;
    }
  }
}
