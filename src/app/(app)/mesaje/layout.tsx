import { DemoGate } from "@/components/demo/demo-gate";

// Cont demo: secțiunea se arată blocată („se configurează pe firma ta”) până o deblochează Super Adminul.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <DemoGate feature="mesaje" area="web">{children}</DemoGate>;
}
