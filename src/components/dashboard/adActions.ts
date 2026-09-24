// The one next step that fits an ad's state — shared by the overview and "My ads".

import type { AdInsight } from "@/lib/adInsights";

export type ActionKind = "pay" | "raise" | "renew" | "edit" | "view";

export interface AdAction {
  kind: ActionKind;
  href: string;
}

export function primaryAction(i: AdInsight): AdAction {
  const id = i.ad.id;
  switch (i.ad.status) {
    case "pending":
      return { kind: "pay", href: `/ads/${id}/pay` };
    case "rejected":
      return { kind: "edit", href: `/ads/${id}/edit` };
    case "pending_verification":
      return { kind: "view", href: `/ads/${id}/pending` };
    case "active":
      if (i.daysLeft === null) return { kind: "renew", href: `/ads/${id}/renew` };
      if (i.nextBidCents !== null) return { kind: "raise", href: `/ads/${id}/bid?to=${i.nextBidCents}` };
      return { kind: "renew", href: `/ads/${id}/renew` };
    default:
      return { kind: "renew", href: `/ads/${id}/renew` };
  }
}

export const STATUS_COLOR: Record<string, string> = {
  active: "var(--success)",
  pending: "var(--gold)",
  pending_verification: "var(--violet-soft)",
  expired: "var(--dim)",
  rejected: "var(--danger)",
};

export function fmtDate(t: { toDate?: () => Date } | null | undefined): string {
  const d = t?.toDate?.();
  if (!d) return "—";
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export function fmtCount(n: number): string {
  return n.toLocaleString("en-US").replace(/,/g, " ");
}
