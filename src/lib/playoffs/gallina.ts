/** Talleres crest, drawn once and reused by the page and the share image. */
export const GALLINA_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" style="width:100%;height:100%" aria-hidden="true"><ellipse cx="14.5" cy="20.5" rx="11" ry="8.2" fill="#14202b"/><ellipse cx="14.5" cy="19.8" rx="9.5" ry="6.7" fill="#fffaf2"/><circle cx="21" cy="13.2" r="6.5" fill="#14202b"/><circle cx="21" cy="12.6" r="5.3" fill="#fffaf2"/><path d="M16.4 8.4c.3-2.6 1.8-4 2.7-4 .8 0 1.4 1 1.5 2.5.6-1.8 1.8-2.9 2.7-2.6.8.2.9 1.6.5 3.1.5-1.4 1.6-2.2 2.4-1.8.7.4.4 1.8 0 2.9-1.6.2-4 .9-7 1.1-.9-.4-2-.9-2.8-1.2z" fill="#e10600"/><path d="M25.4 13.2 30.2 14.8 25.4 16.8z" fill="#f5b301"/><ellipse cx="24.6" cy="16.6" rx="1.15" ry="1.7" fill="#e10600"/><circle cx="22.3" cy="12" r="1.35" fill="#14202b"/><circle cx="22.7" cy="11.55" r="0.42" fill="#fff"/><ellipse cx="12.4" cy="19.8" rx="3.5" ry="2.5" fill="#f0e4d0"/></svg>`;

export function isTalleresCrest(
  team: { id?: string; short?: string; name?: string } | null | undefined,
): boolean {
  if (!team) return false;
  return team.id === "19" || team.short === "Talleres" || (team.name ?? "").startsWith("Talleres");
}
