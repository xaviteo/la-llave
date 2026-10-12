import { GALLINA_SVG, isTalleresCrest } from "./gallina.ts";
import type { BracketSide, KnockoutMatch, PlayoffSnapshot } from "./types";

const W = 1080;
const H = 1350;

const COLUMNS = [
  {
    title: "Llave 1",
    note: "Semifinal S1",
    pairs: [
      { ids: ["P1", "P8"], next: "C1" },
      { ids: ["P4", "P5"], next: "C4" },
    ],
  },
  {
    title: "Llave 2",
    note: "Semifinal S2",
    pairs: [
      { ids: ["P2", "P7"], next: "C2" },
      { ids: ["P3", "P6"], next: "C3" },
    ],
  },
] as const;

export type CardTeam = {
  seed: number;
  zone: string;
  name: string;
  detail: string;
  color: string;
  logo: string;
  chicken: boolean;
};

export type CardMatch = {
  id: string;
  label: string;
  stadium: string;
  changed: boolean;
  teams: [CardTeam, CardTeam];
};

export type LlaveCardModel = {
  kicker: string;
  title: string;
  subtitle: string;
  stamp: string;
  badge: string;
  disclaimer: string;
  predicted: boolean;
  columns: Array<{
    title: string;
    note: string;
    pairs: Array<{ next: string; matches: CardMatch[] }>;
  }>;
};

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function artStamp(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  const date = new Date(parsed.getTime() - 3 * 60 * 60 * 1000);
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()] ?? ""} ${hh}:${mm}`;
}

function teamOf(side: BracketSide, host: boolean): CardTeam {
  const team = side.team;
  const bits = [`Zona ${side.zone}`];
  if (host) bits.push("local");
  if (team) bits.push(`${team.pts} pts`);
  return {
    seed: side.seed,
    zone: side.zone,
    name: team?.short || `${side.seed}° Zona ${side.zone}`,
    detail: bits.join(" · "),
    color: team?.color || "#667687",
    logo: team?.logo || "",
    chicken: isTalleresCrest(team),
  };
}

function matchOf(match: KnockoutMatch, changed: boolean): CardMatch {
  const stadium = match.homeAdvantage.replace(/^Local en\s+/i, "");
  return {
    id: match.id,
    label: match.label,
    stadium,
    changed,
    teams: [teamOf(match.home, true), teamOf(match.away, false)],
  };
}

export function buildLlaveCardModel(
  data: Pick<PlayoffSnapshot, "tournament" | "roundLabel" | "updatedAt" | "octavos">,
  options: { predicted: boolean; live: boolean; projected: boolean; changedIds?: ReadonlySet<string> },
): LlaveCardModel {
  const byId = new Map(data.octavos.map((match) => [match.id, match]));
  const stamp = artStamp(data.updatedAt);
  return {
    kicker: "Liga Profesional",
    title: "MATA MATA",
    subtitle: [data.tournament, "Octavos", data.roundLabel].filter(Boolean).join(" · "),
    stamp: stamp ? `Actualizado ${stamp}` : "",
    badge: options.predicted ? "Predicción" : options.live ? "En vivo" : "Ahora",
    disclaimer: options.predicted
      ? "Con tus resultados. No es el cuadro oficial."
      : options.projected
        ? "Los puntos incluyen partidos que se están jugando."
        : "",
    predicted: options.predicted,
    columns: COLUMNS.map((column) => ({
      title: column.title,
      note: column.note,
      pairs: column.pairs.map((pair) => ({
        next: pair.next,
        matches: pair.ids.flatMap((id) => {
          const match = byId.get(id);
          return match ? [matchOf(match, options.changedIds?.has(id) ?? false)] : [];
        }),
      })),
    })),
  };
}

const INK = {
  bgTop: "#16202a",
  bg: "#0c1014",
  surface: "#171e26",
  card: "#10161c",
  fg: "#eef2f4",
  muted: "#8b9aaa",
  faint: "#6b7c8d",
  accent: "#7eb6d4",
  ink: "#0c1014",
  live: "#e05b5b",
  line: "rgba(238,242,244,0.12)",
};

function fit(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let next = text;
  while (next.length > 1 && ctx.measureText(`${next}…`).width > max) next = next.slice(0, -1);
  return `${next}…`;
}

function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function fillRound(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string,
) {
  ctx.fillStyle = color;
  round(ctx, x, y, w, h, r);
  ctx.fill();
}

function strokeRound(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string,
  width = 2,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  round(ctx, x, y, w, h, r);
  ctx.stroke();
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    const timer = setTimeout(() => resolve(null), 5000);
    image.onload = () => {
      clearTimeout(timer);
      resolve(image);
    };
    image.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    image.src = src;
  });
}

async function loadCrests(model: LlaveCardModel): Promise<Map<string, HTMLImageElement>> {
  const urls = new Set<string>();
  for (const column of model.columns) {
    for (const pair of column.pairs) {
      for (const match of pair.matches) {
        for (const team of match.teams) {
          if (!team.chicken && team.logo) urls.add(team.logo);
        }
      }
    }
  }
  const entries = await Promise.all(
    [...urls].map(async (url) => [url, await loadImage(url)] as const),
  );
  const crests = new Map<string, HTMLImageElement>();
  for (const [url, image] of entries) {
    if (image) crests.set(url, image);
  }
  return crests;
}

function drawCrest(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  x: number,
  y: number,
  size: number,
  fallback: string,
) {
  fillRound(ctx, x, y, size, size, 8, "#1c242c");
  if (!image) {
    ctx.fillStyle = INK.muted;
    ctx.font = "700 12px Figtree, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(fallback.slice(0, 3).toUpperCase(), x + size / 2, y + size / 2);
    return;
  }
  ctx.save();
  round(ctx, x + 3, y + 3, size - 6, size - 6, 6);
  ctx.clip();
  const scale = Math.min((size - 6) / image.width, (size - 6) / image.height);
  const dw = image.width * scale;
  const dh = image.height * scale;
  ctx.drawImage(image, x + (size - dw) / 2, y + (size - dh) / 2, dw, dh);
  ctx.restore();
}

function drawTeam(
  ctx: CanvasRenderingContext2D,
  team: CardTeam,
  crests: Map<string, HTMLImageElement>,
  chicken: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const barX = x + 12;
  fillRound(ctx, barX, y + 10, 5, h - 20, 3, team.color);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "600 20px Oswald, sans-serif";
  ctx.fillStyle = INK.muted;
  ctx.fillText(`${team.seed}°`, barX + 32, y + h / 2);

  const crest = 46;
  const crestX = barX + 54;
  const crestY = y + (h - crest) / 2;
  drawCrest(
    ctx,
    team.chicken ? chicken : crests.get(team.logo) ?? null,
    crestX,
    crestY,
    crest,
    team.name,
  );

  const textX = crestX + crest + 12;
  const textW = x + w - 14 - textX;
  ctx.textAlign = "left";
  ctx.font = "700 24px Figtree, sans-serif";
  ctx.fillStyle = INK.fg;
  ctx.fillText(fit(ctx, team.name, textW), textX, y + h / 2 - 12);
  ctx.font = "500 16px Figtree, sans-serif";
  ctx.fillStyle = INK.faint;
  ctx.fillText(fit(ctx, team.detail, textW), textX, y + h / 2 + 14);
}

function drawMatch(
  ctx: CanvasRenderingContext2D,
  match: CardMatch,
  crests: Map<string, HTMLImageElement>,
  chicken: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  fillRound(ctx, x, y, w, h, 14, INK.card);
  strokeRound(ctx, x, y, w, h, 14, match.changed ? INK.accent : INK.line, match.changed ? 2.5 : 1.5);

  const header = 36;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.font = "600 16px Oswald, sans-serif";
  ctx.fillStyle = INK.muted;
  ctx.fillText(match.label.toUpperCase(), x + 14, y + header / 2 + 2);

  ctx.font = "500 14px Figtree, sans-serif";
  ctx.textAlign = "right";
  const right = match.changed ? "Cambió" : `Local · ${match.stadium}`;
  ctx.fillStyle = match.changed ? INK.accent : INK.faint;
  ctx.fillText(fit(ctx, right, w * 0.58), x + w - 14, y + header / 2 + 2);

  const rowH = (h - header - 8) / 2;
  match.teams.forEach((team, index) => {
    drawTeam(ctx, team, crests, chicken, x, y + header + index * rowH, w, rowH);
  });
}

function drawColumn(
  ctx: CanvasRenderingContext2D,
  column: LlaveCardModel["columns"][number],
  crests: Map<string, HTMLImageElement>,
  chicken: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = "600 28px Oswald, sans-serif";
  ctx.fillStyle = INK.fg;
  ctx.fillText(column.title.toUpperCase(), x, y + 14);
  ctx.font = "500 15px Figtree, sans-serif";
  ctx.fillStyle = INK.faint;
  ctx.fillText(column.note, x, y + 40);

  const head = 62;
  const pairGap = 12;
  const pairH = (h - head - pairGap) / 2;
  column.pairs.forEach((pair, index) => {
    const py = y + head + index * (pairH + pairGap);
    fillRound(ctx, x, py, w, pairH, 18, INK.surface);
    const inner = 12;
    const labelH = 34;
    const cardGap = 8;
    const cardH = (pairH - inner * 2 - labelH - cardGap) / Math.max(pair.matches.length, 1);
    pair.matches.forEach((match, matchIndex) => {
      drawMatch(
        ctx,
        match,
        crests,
        chicken,
        x + inner,
        py + inner + matchIndex * (cardH + cardGap),
        w - inner * 2,
        cardH,
      );
    });
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "600 15px Oswald, sans-serif";
    ctx.fillStyle = INK.accent;
    ctx.fillText(`GANADORES → ${pair.next}`, x + w / 2, py + pairH - labelH / 2 - 2);
  });
}

export async function renderLlavePng(
  data: Pick<PlayoffSnapshot, "tournament" | "roundLabel" | "updatedAt" | "octavos">,
  options: { predicted: boolean; live: boolean; projected: boolean; changedIds?: ReadonlySet<string> },
): Promise<Blob> {
  const model = buildLlaveCardModel(data, options);
  await document.fonts.load("600 72px Oswald");
  await document.fonts.load("600 28px Figtree");
  await document.fonts.ready;

  const chicken = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(GALLINA_SVG)}`);
  const crests = await loadCrests(model);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo armar la imagen");

  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, INK.bgTop);
  sky.addColorStop(0.45, INK.bg);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = INK.accent;
  ctx.fillRect(0, 0, W, 8);

  const headerH = model.disclaimer ? 228 : 188;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = "600 18px Figtree, sans-serif";
  ctx.fillStyle = INK.accent;
  if ("letterSpacing" in ctx) ctx.letterSpacing = "4px";
  ctx.fillText(model.kicker.toUpperCase(), 40, 48);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";

  const badgeW = Math.max(132, model.badge.length * 16 + 36);
  const badgeX = W - 40 - badgeW;
  const badgeColor = model.badge === "En vivo" ? INK.live : model.predicted ? INK.accent : "#243140";
  fillRound(ctx, badgeX, 28, badgeW, 40, 20, badgeColor);
  ctx.font = "700 16px Figtree, sans-serif";
  ctx.fillStyle = model.badge === "Ahora" ? INK.fg : model.badge === "En vivo" ? "#fff" : INK.ink;
  ctx.textAlign = "center";
  ctx.fillText(model.badge.toUpperCase(), badgeX + badgeW / 2, 48);

  ctx.textAlign = "left";
  ctx.font = "600 68px Oswald, sans-serif";
  ctx.fillStyle = INK.fg;
  if ("letterSpacing" in ctx) ctx.letterSpacing = "1px";
  ctx.fillText(model.title, 40, 112);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";

  ctx.font = "500 22px Figtree, sans-serif";
  ctx.fillStyle = INK.muted;
  ctx.fillText(fit(ctx, model.subtitle, W - 80), 40, 162);
  if (model.disclaimer) {
    ctx.font = "600 18px Figtree, sans-serif";
    ctx.fillStyle = model.predicted ? INK.accent : INK.muted;
    ctx.fillText(fit(ctx, model.disclaimer, W - 80), 40, 198);
  }

  const footerH = 64;
  const bodyTop = headerH;
  const bodyH = H - footerH - bodyTop - 12;
  const gap = 16;
  const colW = (W - 80 - gap) / 2;
  model.columns.forEach((column, index) => {
    drawColumn(ctx, column, crests, chicken, 40 + index * (colW + gap), bodyTop, colW, bodyH);
  });

  ctx.fillStyle = "rgba(238,242,244,0.1)";
  ctx.fillRect(40, H - footerH, W - 80, 1);
  ctx.font = "500 16px Figtree, sans-serif";
  ctx.fillStyle = INK.faint;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(model.stamp || "Octavos", 40, H - footerH / 2);
  ctx.textAlign = "right";
  ctx.fillStyle = INK.accent;
  ctx.font = "600 18px Figtree, sans-serif";
  ctx.fillText("pirata.app", W - 40, H - footerH / 2);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("No se pudo armar la imagen");
  return blob;
}

export type PublishResult = "shared" | "copied" | "downloaded" | "cancelled";

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function shareCancelled(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export async function publishLlaveCard(blob: Blob): Promise<PublishResult> {
  const file = new File([blob], "mata-mata-llave.png", { type: "image/png" });
  if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: "MATA MATA",
        text: "La llave de octavos · pirata.app",
      });
      return "shared";
    } catch (error) {
      if (shareCancelled(error)) return "cancelled";
    }
  }
  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      return "copied";
    }
  } catch {
    /* The download still gives them the image. */
  }
  downloadBlob(blob, file.name);
  return "downloaded";
}
