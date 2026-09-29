import type { Database } from "@/lib/supabase/database.types";

type UserRole = Database["public"]["Enums"]["user_role"];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator companie",
  manager: "Manager / Dispatcher",
  team_leader: "Team Leader",
  technician: "Tehnician",
  client: "Client",
};
