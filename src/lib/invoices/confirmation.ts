import type { Review } from "./rules";
export async function confirmInvoice(
  id: string, review: Review, approve: boolean,
  action: (id: string, action: string, data?: Record<string, unknown>) => Promise<unknown>,
) {
  await action(id, "review", review);
  if (approve) await action(id, "approve");
}