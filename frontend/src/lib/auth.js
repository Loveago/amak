import { redirect } from "next/navigation";
import { getSessionUser } from "./session";

function buildRedirect(nextPath) {
  if (!nextPath) return "/login";
  const params = new URLSearchParams({ next: nextPath });
  return `/login?${params.toString()}`;
}

export function requireUser(nextPath) {
  const user = getSessionUser();
  if (!user) {
    redirect(buildRedirect(nextPath));
  }
  return user;
}

export function requireAgent(nextPath) {
  const user = requireUser(nextPath);
  if (user.role !== "AGENT") {
    redirect(buildRedirect(nextPath));
  }
  return user;
}

export function requireAdmin(nextPath) {
  const user = requireUser(nextPath);
  if (user.role !== "ADMIN") {
    redirect(buildRedirect(nextPath));
  }
  return user;
}
