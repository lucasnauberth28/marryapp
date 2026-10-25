import { RolagemSuave } from "@/components/motion/smooth-scroll";
import { AvisoDeManutencaoParaConvidados } from "@/components/maintenance/guest-notice";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <RolagemSuave />
      <AvisoDeManutencaoParaConvidados />
      <main id="conteudo" className="min-h-screen bg-transparent">
        {children}
      </main>
    </>
  );
}
