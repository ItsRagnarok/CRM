import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, LEGAL_CUI, LEGAL_FORM, LEGAL_REG, LEGAL_SEAT } from "@/lib/contact";

/** Cine furnizează ElectroField: forma, CUI, Registrul Comerțului, sediul și contactul. */
export function LegalIdentity() {
  return (
    <p className="mt-1.5">
      Serviciul ElectroField este furnizat de o {LEGAL_FORM} înregistrată în România: CUI {LEGAL_CUI}, nr. de ordine în
      Registrul Comerțului {LEGAL_REG}, cu sediul în {LEGAL_SEAT}. Contact: {CONTACT_EMAIL}, {CONTACT_PHONE_DISPLAY}. Datele
      complete de identificare sunt publice în registrele ANAF și ONRC, după CUI, și se comunică la cerere.
    </p>
  );
}
