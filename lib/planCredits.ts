export type PlanId = "starter" | "pro" | "elite";
export const PLAN_CREDITS: Record<PlanId, number> = {
  starter: 1600, pro: 2800, elite: 5800,
};
