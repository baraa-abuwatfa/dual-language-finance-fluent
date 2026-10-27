import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { WorkspacePlaceholder } from "@/components/auth/WorkspacePlaceholder";
import { getCompanyAccess } from "@/lib/auth/membership.functions";
import { authHead } from "@/lib/auth/head";

const accessOptions = queryOptions({ queryKey: ["company-access"], queryFn: () => getCompanyAccess() });

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => authHead("Dashboard", "Your secure AI CFO dashboard and company access status."),
  loader: async ({ context }) => { await context.queryClient.ensureQueryData(accessOptions); },
  component: Dashboard,
  errorComponent: () => <WorkspacePlaceholder kind="workspace" companyName={null} error />,
  notFoundComponent: () => <WorkspacePlaceholder kind="workspace" companyName={null} error />,
});

function Dashboard() {
  const { data } = useSuspenseQuery(accessOptions);
  const kind = data.destination === "/company-setup" ? "setup" : data.destination === "/select-company" ? "multiple" : "workspace";
  return <WorkspacePlaceholder kind={kind} companyName={data.companyName} error={!data.destination} />;
}