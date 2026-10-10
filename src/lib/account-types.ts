import { z } from "zod";
export const accountUsageSchema = z.object({
  plan: z.enum(["free", "pro"]),
  limit: z.number().int().positive(),
  used: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  remaining: z.number().int().nonnegative(),
  resetsAt: z.string(),
  monthly: z.object({ limit: z.number().int().positive(), used: z.number().int().nonnegative(), remaining: z.number().int().nonnegative(), resetsAt: z.string() }).nullable().optional(),
});
export const accountStateSchema = z.object({
  usage: accountUsageSchema,
  subscription: z
    .object({
      status: z.string(),
      environment: z.enum(["sandbox", "live"]),
      renewsAt: z.string().nullable(),
    })
    .nullable(),
  billing: z.object({
    environment: z.enum(["sandbox", "live"]),
    ready: z.boolean(),
  }),
});
export type AccountUsage = z.infer<typeof accountUsageSchema>;
export type AccountState = z.infer<typeof accountStateSchema>;
