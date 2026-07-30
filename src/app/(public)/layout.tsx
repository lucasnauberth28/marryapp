import { PublicHeaderFooter } from "@/components/public/public-header-footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicHeaderFooter>{children}</PublicHeaderFooter>;
}
