import type { ReactNode } from "react";

/** Rótulo fixo para controles que não são campo de texto (seletor de cor e envio de foto). */
export function CampoDoEditor({ id, label, hint, group, children }: { id: string; label: string; hint?: string; group?: boolean; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5" {...(group ? { role: "group", "aria-labelledby": `${id}-rotulo` } : {})}>
      {group ? (
        <span id={`${id}-rotulo`} className="text-sm font-semibold text-tinta">
          {label}
        </span>
      ) : (
        <label htmlFor={id} className="text-sm font-semibold text-tinta">
          {label}
        </label>
      )}
      {children}
      {hint && <p className="text-sm text-tinta-suave">{hint}</p>}
    </div>
  );
}
