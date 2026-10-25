"use client";
// O código QR que leva a uma página do casamento: o endereço vem do navegador, então vale também no domínio próprio.
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { QRCodeSVG } from "qrcode.react";
import { MolduraDoQr } from "@/components/ui/qr-frame";
import type { PropriedadesDeLink } from "../../../dados-do-site";

const semAssinatura = () => () => {};

export function QrDaPagina({ href, rotulo, linkProps }: { href: string; rotulo: string; linkProps: PropriedadesDeLink }) {
  const origem = useSyncExternalStore(semAssinatura, () => window.location.origin, () => "");
  return (
    <Link href={href} className="flex flex-col items-center gap-2 text-[#fff] no-underline" aria-label={rotulo} {...linkProps}>
      <MolduraDoQr className="!p-2">{origem ? <QRCodeSVG value={`${origem}${href}`} size={88} marginSize={0} /> : <span className="block size-[88px]" />}</MolduraDoQr>
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">{rotulo}</span>
    </Link>
  );
}
