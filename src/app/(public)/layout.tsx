import { SmoothScroll } from "@/components/motion/smooth-scroll";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SmoothScroll />
      <main id="conteudo" className="min-h-screen bg-transparent">
        {children}
      </main>
    </>
  );
}
