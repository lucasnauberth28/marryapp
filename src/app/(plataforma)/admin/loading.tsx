import { OverviewSkeleton } from "./_visao-geral/skeletons";

// Visão geral. Também serve de reserva para qualquer tela de /admin que ainda não tenha o próprio loading.tsx.
export default function Loading() {
  return <OverviewSkeleton />;
}
