import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // For demo purposes, always use the default demo user
  // In a real app without auth, you might want to use session storage or cookies
  const user = await db.getUserByOpenId("demo_user");

  return {
    req: opts.req,
    res: opts.res,
    user: user ?? null,
  };
}
