import { createFileRoute, redirect } from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";
import { AppShell } from "@/components/app/AppShell";
import { PageError } from "@/components/app/ui";
import { getCompanyAccess } from "@/lib/auth/membership.functions";
import { resolveCompany, storedCompanyId } from "@/lib/company/selection";

export const accessOptions = queryOptions({ queryKey: ["company-access"], queryFn: () => getCompanyAccess() });

export const Route = createFileRoute("/_authenticated/_company")({
  beforeLoad: async ({ context }) => {
    const access = await context.queryClient.ensureQueryData(accessOptions);
    if (!access.destination) throw new Error("access");
    const picked = resolveCompany(access.companies, storedCompanyId());
    if (picked === "setup") throw redirect({ to: "/company-setup", replace: true });
    if (picked === "select") throw redirect({ to: "/select-company", replace: true });
    return { company: picked, companyCount: access.companies.length };
  },
  component: AppShell,
  errorComponent: PageError,
});
