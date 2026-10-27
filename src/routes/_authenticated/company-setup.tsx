import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePlaceholder } from "@/components/auth/WorkspacePlaceholder";
import { authHead } from "@/lib/auth/head";
import { loadCompanyAccess } from "@/lib/auth/access";
export const Route = createFileRoute("/_authenticated/company-setup")({ head: () => authHead("Company setup", "Your AI CFO company onboarding status."), loader: () => loadCompanyAccess("/company-setup"), component: Setup });
function Setup() { const data = Route.useLoaderData(); return <WorkspacePlaceholder kind="setup" companyName={null} error={!data.destination} />; }