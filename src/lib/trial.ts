import { DAY_MS, milliseconds } from "./auction";

export const FREE_TRIAL_DAYS = 7;
export const FREE_TRIAL_MS = FREE_TRIAL_DAYS * DAY_MS;

type TrialUser = { trialExpiresAt?: Parameters<typeof milliseconds>[0] };

export function trialExpiry(user: TrialUser | undefined): number {
  return milliseconds(user?.trialExpiresAt);
}

export function isTrialActive(user: TrialUser | undefined, now = Date.now()): boolean {
  return trialExpiry(user) > now;
}

export function freeCampaignExpiry(now: number, durationDays: number, trialEndsAt: number): number {
  return Math.min(now + durationDays * DAY_MS, trialEndsAt);
}
