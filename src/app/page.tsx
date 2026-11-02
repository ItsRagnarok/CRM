import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MarketingLanding } from "@/components/marketing/marketing-landing";
import { publicPageMetadata, SITE_DESCRIPTION, SITE_URL } from "@/lib/seo";

export const metadata = publicPageMetadata(
  "CRM pentru firme de instalații și echipe de teren | ElectroField",
  SITE_DESCRIPTION,
  "/",
);

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "ElectroField",
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
      email: "contact@electrofield.ro",
      areaServed: { "@type": "Country", name: "Romania" },
    },
    {
      "@type": "SoftwareApplication",
      name: "ElectroField",
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, Android",
      inLanguage: "ro-RO",
      publisher: { "@id": `${SITE_URL}/#organization` },
      featureList: ["Gestionare lucrări", "Programări", "Clienți", "Echipe de teren", "Pontaj", "Materiale", "Rapoarte"],
    },
  ],
};

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
        <MarketingLanding />
      </>
    );
  }

  const { data: platformAdmin } = await supabase
    .from("platform_admins")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (platformAdmin) redirect("/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  // Field roles land on the mobile-optimized flow by default; office roles
  // (admin/manager) get the desktop dashboard. Either can still navigate to
  // the other manually — this only picks the default landing page.
  const fieldRoles = ["technician", "team_leader"];
  redirect(profile && fieldRoles.includes(profile.role) ? "/mobil" : "/dashboard");
}
