import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Database } from "@/lib/supabase/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Organization = Database["public"]["Tables"]["organizations"]["Row"];

export type SessionContext = {
  userId: string;
  email: string | null;
  profile: Profile;
  organization: Organization;
};

/**
 * Loads the signed-in user's profile + organization, creating them on first
 * login if the user just confirmed their email (signup couldn't call the RPC
 * yet because there was no session at signUp() time).
 *
 * Deliberately NOT wrapped in React's `cache()`: it call redirect() internally,
 * and cache() would memoize (and replay) that thrown redirect across what
 * should be independent calls — including later Server Actions — which
 * produced spurious "you're logged out" redirects for a fully valid session.
 * Race protection for the one-time signup RPC is handled below instead.
 */
export async function requireSessionContext(): Promise<SessionContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const orgName =
      (user.user_metadata?.org_name as string | undefined) || "Compania mea";
    const fullName =
      (user.user_metadata?.full_name as string | undefined) ||
      user.email ||
      "Administrator";

    const { error: rpcError } = await supabase.rpc(
      "create_organization_and_owner",
      { org_name: orgName, owner_full_name: fullName }
    );

    // Defensive: two concurrent requests (e.g. two tabs) can both see "no
    // profile yet" and race to call the RPC; the loser just re-reads the
    // profile the winner created instead of failing the page.
    const isRaceLoss =
      rpcError && rpcError.message.includes("already belongs to an organization");

    if (rpcError && !isRaceLoss) {
      throw rpcError;
    }

    const { data: createdProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = createdProfile;
  }

  if (!profile) {
    redirect("/login");
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", profile.organization_id)
    .single();

  if (!organization) {
    redirect("/login");
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    profile,
    organization,
  };
}

export const ROLE_LABELS: Record<Profile["role"], string> = {
  admin: "Administrator",
  manager: "Manager / Dispatcher",
  team_leader: "Team Leader",
  technician: "Tehnician",
  client: "Client",
};
