import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePlaceholder } from "@/components/auth/WorkspacePlaceholder";
import { authHead } from "@/lib/auth/head";
import { loadCompanyAccess } from "@/lib/auth/access";
export const Route = createFileRoute("/_authenticated/workspace")({ head: () => authHead("Your workspace", "Your secure AI CFO workspace."), loader: () => loadCompanyAccess("/workspace"), component: Workspace });
function Workspace() { const data = Route.useLoaderData(); return <WorkspacePlaceholder kind="workspace" companyName={data.companyName} error={!data.destination} />; }