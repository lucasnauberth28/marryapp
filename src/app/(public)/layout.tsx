import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { GuestMaintenanceNotice } from "@/components/maintenance/guest-notice";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SmoothScroll />
      <GuestMaintenanceNotice />
      <main id="conteudo" className="min-h-screen bg-transparent">
        {children}
      </main>
    </>
  );
}
