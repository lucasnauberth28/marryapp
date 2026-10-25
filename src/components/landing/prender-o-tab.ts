const FOCAVEIS_PADRAO = "a[href], button:not([disabled])";

/** Mantém o foco dentro do menu: do último item volta ao primeiro, e vice-versa. */
export function prenderOTab(e: KeyboardEvent, dialog: HTMLElement, seletor: string = FOCAVEIS_PADRAO) {
  const items = dialog.querySelectorAll<HTMLElement>(seletor);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
