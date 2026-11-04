import type { Json } from "@/lib/supabase/database.types";

export const defaultConfirmation = {
  subject: "Confirmare programare ElectroField",
  message: "Bună, {nume}!\n\nÎți mulțumim pentru programare. Discuția are loc pe {data}, la ora {ora}, ora României.",
};

export function bookingConfirmation(weekly: Json | undefined) {
  const value = weekly && typeof weekly === "object" && !Array.isArray(weekly) ? weekly._confirmation : null;
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaultConfirmation;
  return {
    subject: typeof value.subject === "string" && value.subject.trim() ? value.subject : defaultConfirmation.subject,
    message: typeof value.message === "string" && value.message.trim() ? value.message : defaultConfirmation.message,
  };
}

export function validBookingEmail(email: string) {
  return email.length <= 254 && /^[^\s@<>,;"]+@[^\s@<>,;".]+(?:\.[^\s@<>,;".]+)+$/.test(email);
}
