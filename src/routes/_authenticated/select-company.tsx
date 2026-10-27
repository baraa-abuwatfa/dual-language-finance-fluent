import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePlaceholder } from "@/components/auth/WorkspacePlaceholder";
import { authHead } from "@/lib/auth/head";
import { loadCompanyAccess } from "@/lib/auth/access";
export const Route = createFileRoute("/_authenticated/select-company")({ head: () => authHead("Company selection", "Your AI CFO company selection status."), loader: () => loadCompanyAccess("/select-company"), component: Selection });
function Selection() { const data = Route.useLoaderData(); return <WorkspacePlaceholder kind="multiple" companyName={null} error={!data.destination} />; }