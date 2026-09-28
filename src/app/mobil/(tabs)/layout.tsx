import { MobileNav } from "@/components/mobile-nav";

export default function MobileTabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex-1 overflow-auto">{children}</div>
      <MobileNav />
    </>
  );
}
