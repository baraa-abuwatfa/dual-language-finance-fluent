import { redirect } from "@tanstack/react-router";
import { getCompanyAccess } from "./membership.functions";
export async function loadCompanyAccess(expected: "/workspace" | "/company-setup" | "/select-company") {
  const access = await getCompanyAccess();
  if (access.destination && access.destination !== expected) throw redirect({ to: access.destination, replace: true });
  return access;
}