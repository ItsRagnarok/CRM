import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Database } from "@/lib/supabase/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Organization = Database["public"]["Tables"]["organizations"]["Row"];
type UserRole = Database["public"]["Enums"]["user_role"];

// technician/team_leader are the mobile/field roles — they get the /mobil
// app, not the desktop back office. Kept as one shared list so login
// routing and the (app) layout guard can't drift apart.
export const FIELD_ROLES: UserRole[] = ["technician", "team_leader"];

export type SessionContext = {
  userId: string;
  email: string | null;
  profile: Profile;
  organization: Organization;
};

export type AdminContext = {
  userId: string;
  email: string | null;
  fullName: string;
};

/**
 * Loads the platform owner's context. A platform admin (ElectroField itself,
 * e.g. info@alpora.ro) is deliberately NOT a row in public.profiles — every
 * profile is scoped to one tenant organization_id, and a platform admin
 * manages every tenant, not one of them. See public.platform_admins.
 */
export async function requireAdminContext(): Promise<AdminContext> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    redirect("/login");
  }

  const { data: admin } = await supabase
    .from("platform_admins")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!admin) {
    redirect("/dashboard");
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    fullName: admin.full_name,
  };
}

/**
 * Loads the signed-in user's profile + organization, creating them on first
 * login if the user just confirmed their email (signup couldn't call the RPC
 * yet because there was no session at signUp() time).
 *
 * Wrapped in React's `cache()` below: both (app)/layout.tsx and every page
 * under it call this, and without caching that was two extra DB round trips
 * (profiles, organizations) duplicated on every single navigation. `cache()`
 * scopes to one request, so a Server Action invocation — a separate request —
 * always re-runs this fresh; it never sees a stale value from an earlier page
 * load. A thrown redirect() is cached and replayed the same way a resolved
 * value is, which is correct here: two calls in the same request that would
 * both redirect should redirect to the same place, not diverge.
 */
async function requireSessionContextUncached(): Promise<SessionContext> {
  const supabase = await createClient();
  // getSession() decodes the already-validated cookie locally (no network
  // round trip); middleware is the one place that calls the slower
  // getUser() (which re-checks the token with Supabase) on every request,
  // so re-doing that check here would just double the latency of every page.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    redirect("/login");
  }

  // profiles.organization_id is a to-one FK, so this embed fetches both
  // rows in a single round trip instead of two sequential ones.
  let { data: profileRow } = await supabase
    .from("profiles")
    .select("*, organizations(*)")
    .eq("id", user.id)
    .maybeSingle();

  if (!profileRow) {
    const { data: platformAdmin } = await supabase
      .from("platform_admins")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (platformAdmin) {
      redirect("/admin");
    }

    const orgName =
      (user.user_metadata?.org_name as string | undefined) || "Compania mea";
    const fullName =
      (user.user_metadata?.full_name as string | undefined) ||
      user.email ||
      "Administrator";
    const termsAccepted = Boolean(user.user_metadata?.terms_accepted);

    const { error: rpcError } = await supabase.rpc(
      "create_organization_and_owner",
      { org_name: orgName, owner_full_name: fullName, terms_accepted: termsAccepted }
    );

    // Defensive: two concurrent requests (e.g. two tabs) can both see "no
    // profile yet" and race to call the RPC; the loser just re-reads the
    // profile the winner created instead of failing the page.
    const isRaceLoss =
      rpcError && rpcError.message.includes("already belongs to an organization");

    if (rpcError && !isRaceLoss) {
      throw rpcError;
    }

    const { data: createdProfileRow } = await supabase
      .from("profiles")
      .select("*, organizations(*)")
      .eq("id", user.id)
      .single();
    profileRow = createdProfileRow;
  }

  if (!profileRow || !profileRow.organizations) {
    redirect("/login");
  }

  const { organizations: organization, ...profile } = profileRow;

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: profile as Profile,
    organization,
  };
}

export const requireSessionContext = cache(requireSessionContextUncached);

export { ROLE_LABELS } from "@/lib/role-labels";
