import { DemoGate } from "@/components/demo/demo-gate";

// Cont demo: funcția se arată blocată pe telefon până o deblochează Super Adminul.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <DemoGate feature="m_cheltuieli" area="mobil">{children}</DemoGate>;
}
