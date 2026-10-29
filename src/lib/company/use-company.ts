import { getRouteApi } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { dashCopy } from "@/lib/dashboard/copy";

const api = getRouteApi("/_authenticated/_company");
export function useCompany() { return api.useRouteContext({ select: (c) => ({ company: c.company, companyCount: c.companyCount }) }); }
export function useAppCopy() { const { locale } = useI18n(); return { t: dashCopy[locale], locale }; }
