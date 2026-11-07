import { redirect } from "next/navigation";

// The map is now a view inside "Lucrări".
export default function MobileMapRedirect() {
  redirect("/mobil/lucrari?vedere=harta");
}
