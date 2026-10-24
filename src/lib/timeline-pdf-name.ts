/** Nome do arquivo do PDF do cronograma, com os nomes do casal (sem acento nem símbolo): "cronograma-ana-e-bia.pdf". */
export function timelinePdfFileName(coupleNames: string): string {
  const slug = coupleNames
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/(^|-)e(-e)+(-|$)/g, "$1e$3")
    .slice(0, 60)
    .replace(/-+$/, "");
  return `cronograma-${slug || "casamento"}.pdf`;
}
