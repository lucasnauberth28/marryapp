import type { Canal, Publico } from "@/lib/platform/announcement";

export interface ValoresIniciaisDaRedacao {
  id?: string;
  title: string;
  emailSubject: string;
  body: string;
  linkUrl: string;
  audience: Publico;
  channels: Canal[];
}

export interface ItemDeRascunho {
  id: string;
  title: string;
  updatedAtLabel: string;
}
