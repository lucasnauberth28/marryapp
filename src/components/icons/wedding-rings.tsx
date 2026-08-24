import React from "react";

export function WeddingRingsIcon({
  className = "w-6 h-6",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Anel 1 */}
      <circle
        cx="12.5"
        cy="17"
        r="7.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Anel 2 Entrelaçado */}
      <circle
        cx="19.5"
        cy="15"
        r="7.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Brilho / Detalhe de aliança de noivado */}
      <path
        d="M19.5 5.5L21 7.5L19.5 9.5L18 7.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
