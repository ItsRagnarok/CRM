import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Database } from "@/lib/supabase/database.types";
import { cookies, headers } from "next/headers";
import { parsePreview, PREVIEW_COOKIE } from "@/lib/preview";

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
  readOnly?: boolean;
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
  const supabase = await createClient({ ignorePreview: true });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: admin, error: adminError } = await supabase
    .from("platform_admins")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (adminError) throw new Error("Nu am putut verifica accesul de administrator. Reîncearcă.");

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
  // Never use an unverified cookie to choose a company or administrator context.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const preview = parsePreview((await cookies()).get(PREVIEW_COOKIE)?.value);
  if (preview) {
    const identity = await createClient({ ignorePreview: true });
    const { data: admin, error: adminError } = await identity.from("platform_admins").select("id").eq("id", user.id).maybeSingle();
    if (adminError) throw new Error("Nu am putut verifica accesul de administrator.");
    if (!admin) redirect("/auth/clear-preview");
    if ((await headers()).has("next-action")) throw new Error("Modul de vizualizare nu permite modificări.");
    const { data: previewProfile, error: previewError } = await supabase.from("profiles").select("*, organizations!profiles_organization_id_fkey(*)")
      .eq("id", preview.profileId).eq("organization_id", preview.organizationId).maybeSingle();
    if (previewError) throw new Error("Nu am putut încărca vizualizarea companiei. Reîncearcă sau închide vizualizarea.");
    if (!previewProfile?.organizations) redirect("/auth/clear-preview");
    const { organizations, ...profile } = previewProfile;
    return { userId: user.id, email: user.email ?? null, profile: profile as Profile, organization: organizations, readOnly: true };
  }

  // profiles.organization_id is a to-one FK, so this embed fetches both
  // rows in a single round trip instead of two sequential ones.
  const profileResult = await supabase
    .from("profiles")
    .select("*, organizations!profiles_organization_id_fkey(*)")
    .eq("id", user.id)
    .maybeSingle();
  if (profileResult.error) throw new Error("Nu am putut încărca profilul companiei. Reîncearcă.");
  let profileRow = profileResult.data;

  if (!profileRow) {
    const { data: platformAdmin, error: platformAdminError } = await supabase
      .from("platform_admins")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (platformAdminError) throw new Error("Nu am putut verifica accesul la platformă.");

    if (platformAdmin) {
      redirect("/admin");
    }

    const orgName =
      (user.user_metadata?.org_name as string | undefined) || "Compania mea";
    const fullName =
      (user.user_metadata?.full_name as string | undefined) ||
      user.email ||
      "Administrator";
    // The real, detailed Terms & Conditions acceptance happens on the
    // mandatory /accepta-termeni gate below, not at signup — so a
    // newly-created organization always starts unaccepted here.
    const { error: rpcError } = await supabase.rpc(
      "create_organization_and_owner",
      { org_name: orgName, owner_full_name: fullName, terms_accepted: false }
    );

    // Defensive: two concurrent requests (e.g. two tabs) can both see "no
    // profile yet" and race to call the RPC; the loser just re-reads the
    // profile the winner created instead of failing the page.
    const isRaceLoss =
      rpcError && rpcError.message.includes("already belongs to an organization");

    if (rpcError && !isRaceLoss) {
      throw rpcError;
    }

    const { data: createdProfileRow, error: createdProfileError } = await supabase
      .from("profiles")
      .select("*, organizations!profiles_organization_id_fkey(*)")
      .eq("id", user.id)
      .single();
    if (createdProfileError) throw new Error("Nu am putut încărca profilul creat. Reîncearcă.");
    profileRow = createdProfileRow;
  }

  if (!profileRow || !profileRow.organizations) {
    throw new Error("Contul autentificat nu are o companie disponibilă. Contactează administratorul platformei.");
  }

  const { organizations: organization, ...profile } = profileRow;

  // Suspended (by platform admin, or because the organization declined the
  // terms below) — blocked on every request, for every user in the org,
  // until a platform admin reactivates it. This page does its own lighter
  // session fetch instead of calling requireSessionContext, so it can't loop.
  if (!organization.is_active) {
    redirect("/cont-suspendat");
  }

  // Mandatory terms acceptance gate. Every page under (app) and mobil goes
  // through this function, so putting the check here (rather than in each
  // layout) covers both with one gate. /accepta-termeni itself fetches the
  // session directly instead of calling requireSessionContext, so it never
  // redirects to itself.
  if (!organization.terms_accepted_at) {
    redirect("/accepta-termeni");
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: profile as Profile,
    organization,
  };
}

export const requireSessionContext = cache(requireSessionContextUncached);

export { ROLE_LABELS } from "@/lib/role-labels";
