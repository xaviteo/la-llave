import { GALLINA_SVG, isTalleresCrest } from "./gallina.ts";
import type { BracketSide, KnockoutMatch, PlayoffSnapshot } from "./types";

const W = 1920;
const H = 1080;
const FILE_NAME = "mata-mata-llave.png";

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

type Box = { x: number; y: number; w: number; h: number };

function drawBox(ctx: CanvasRenderingContext2D, box: Box, stroke: string, width = 1.5) {
  ctx.fillStyle = INK.card;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  const inset = width / 2;
  ctx.strokeRect(box.x + inset, box.y + inset, box.w - width, box.h - width);
}

function drawJoin(ctx: CanvasRenderingContext2D, a: Box, b: Box, to: Box) {
  const xFrom = a.x + a.w;
  const yA = a.y + a.h / 2;
  const yB = b.y + b.h / 2;
  const yTo = to.y + to.h / 2;
  const mid = xFrom + (to.x - xFrom) / 2;
  ctx.strokeStyle = "rgba(238,242,244,0.42)";
  ctx.lineWidth = 2;
  ctx.lineJoin = "miter";
  ctx.beginPath();
  ctx.moveTo(xFrom, yA);
  ctx.lineTo(mid, yA);
  ctx.lineTo(mid, yB);
  ctx.lineTo(xFrom, yB);
  ctx.moveTo(mid, yTo);
  ctx.lineTo(to.x, yTo);
  ctx.stroke();
}

function drawTeamRow(
  ctx: CanvasRenderingContext2D,
  team: CardTeam,
  host: boolean,
  crests: Map<string, HTMLImageElement>,
  chicken: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const barW = 4;
  ctx.fillStyle = team.color;
  ctx.fillRect(x + 12, y + (h - 26) / 2, barW, 26);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = "600 15px Oswald, sans-serif";
  ctx.fillStyle = INK.muted;
  const seed = `${team.seed}°${host ? " L" : ""}`;
  ctx.fillText(seed, x + 24, y + h / 2);
  const crest = 32;
  const crestX = x + 24 + ctx.measureText(seed).width + 10;
  drawCrest(
    ctx,
    team.chicken ? chicken : (crests.get(team.logo) ?? null),
    crestX,
    y + (h - crest) / 2,
    crest,
    team.name,
  );
  const textX = crestX + crest + 10;
  ctx.font = "600 22px Oswald, sans-serif";
  ctx.fillStyle = INK.fg;
  ctx.fillText(fit(ctx, team.name, x + w - 12 - textX), textX, y + h / 2);
}

function drawOctavos(
  ctx: CanvasRenderingContext2D,
  match: CardMatch,
  crests: Map<string, HTMLImageElement>,
  chicken: HTMLImageElement | null,
  box: Box,
) {
  drawBox(ctx, box, match.changed ? INK.accent : INK.line, match.changed ? 2.5 : 1.5);
  const header = 20;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.font = "600 12px Oswald, sans-serif";
  ctx.fillStyle = INK.faint;
  ctx.fillText(match.label.toUpperCase(), box.x + 12, box.y + header / 2 + 1);
  ctx.font = "500 12px Figtree, sans-serif";
  ctx.textAlign = "right";
  ctx.fillStyle = match.changed ? INK.accent : INK.faint;
  const right = match.changed ? "Cambió" : match.stadium;
  ctx.fillText(fit(ctx, right, box.w * 0.48), box.x + box.w - 12, box.y + header / 2 + 1);
  const rowH = (box.h - header) / 2;
  match.teams.forEach((team, index) => {
    drawTeamRow(ctx, team, index === 0, crests, chicken, box.x, box.y + header + index * rowH, box.w, rowH);
  });
}

function drawLater(ctx: CanvasRenderingContext2D, title: string, a: string, b: string, box: Box, changed: boolean) {
  drawBox(ctx, box, changed ? INK.accent : INK.line, changed ? 2.5 : 1.5);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = "600 12px Oswald, sans-serif";
  ctx.fillStyle = INK.faint;
  ctx.fillText(title, box.x + 14, box.y + 16);
  ctx.font = "600 18px Oswald, sans-serif";
  ctx.fillStyle = INK.fg;
  ctx.fillText(fit(ctx, a, box.w - 28), box.x + 14, box.y + 42);
  ctx.font = "500 11px Figtree, sans-serif";
  ctx.fillStyle = INK.faint;
  ctx.fillText("vs", box.x + 14, box.y + 64);
  ctx.font = "600 18px Oswald, sans-serif";
  ctx.fillStyle = INK.fg;
  ctx.fillText(fit(ctx, b, box.w - 28), box.x + 14, box.y + box.h - 18);
}

function drawCup(ctx: CanvasRenderingContext2D, cx: number, top: number, scale: number) {
  ctx.save();
  ctx.translate(cx - 32 * scale, top);
  ctx.scale(scale, scale);
  const paint = (d: string, fill: string | null, stroke: string | null, width = 1.6) => {
    const path = new Path2D(d);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill(path);
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke(path);
    }
  };
  paint("M20 8h24v10c0 10-5 18-12 20-7-2-12-10-12-20V8z", "#e4c36a", "#6e5214");
  ctx.save();
  ctx.globalAlpha = 0.8;
  paint("M26 12c1 8 2 14 2 18", null, "#fff4cc");
  ctx.restore();
  paint("M20 14h-7c-4 0-7 3.2-7 7.2S9.2 28 14 28h6", null, "#e4c36a", 3);
  paint("M44 14h7c4 0 7 3.2 7 7.2S54.8 28 50 28h-6", null, "#e4c36a", 3);
  paint("M29 38h6l-1 10h-4l-1-10z", "#c9a44a", "#6e5214", 1);
  paint("M20 50h24l-3 8H23l-3-8z", "#e4c36a", "#6e5214", 1.4);
  paint("M18 62h28v3.5H18z", "#6e5214", null);
  ctx.restore();
}

function drawFinal(ctx: CanvasRenderingContext2D, box: Box, changed: boolean) {
  drawBox(ctx, box, changed ? INK.accent : "#c6a24e", changed ? 2.5 : 2);
  drawCup(ctx, box.x + box.w / 2, box.y + 16, 1.2);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "600 13px Oswald, sans-serif";
  ctx.fillStyle = INK.muted;
  ctx.fillText("FINAL", box.x + box.w / 2, box.y + 112);
  ctx.font = "600 22px Oswald, sans-serif";
  ctx.fillStyle = INK.fg;
  ctx.fillText("Ganador S1", box.x + box.w / 2, box.y + 146);
  ctx.font = "500 12px Figtree, sans-serif";
  ctx.fillStyle = INK.faint;
  ctx.fillText("vs", box.x + box.w / 2, box.y + 170);
  ctx.font = "600 22px Oswald, sans-serif";
  ctx.fillStyle = INK.fg;
  ctx.fillText("Ganador S2", box.x + box.w / 2, box.y + 196);
  ctx.font = "500 12px Figtree, sans-serif";
  ctx.fillStyle = INK.faint;
  ctx.fillText("Sede LPF", box.x + box.w / 2, box.y + box.h - 22);
}

function feedLine(match: CardMatch | undefined): string {
  if (!match) return "—";
  return match.teams.map((team) => team.name).join(" / ");
}

function centeredOn(a: Box, b: Box, x: number, w: number, h: number): Box {
  const mid = (a.y + a.h / 2 + b.y + b.h / 2) / 2;
  return { x, y: mid - h / 2, w, h };
}

export async function renderLlavePng(
  data: Pick<PlayoffSnapshot, "tournament" | "roundLabel" | "updatedAt" | "octavos">,
  options: { predicted: boolean; live: boolean; projected: boolean; changedIds?: ReadonlySet<string> },
): Promise<Blob> {
  const model = buildLlaveCardModel(data, options);
  await document.fonts.load("600 52px Oswald");
  await document.fonts.load("600 22px Oswald");
  await document.fonts.ready;

  const chicken = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(GALLINA_SVG)}`);
  const crests = await loadCrests(model);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo armar la imagen");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.fillStyle = INK.bg;
  ctx.fillRect(0, 0, W, H);

  const headerH = model.disclaimer ? 64 : 44;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = "600 18px Oswald, sans-serif";
  ctx.fillStyle = INK.muted;
  ctx.fillText(model.title, 40, 22);
  ctx.font = "500 12px Figtree, sans-serif";
  ctx.fillStyle = INK.faint;
  ctx.textAlign = "right";
  ctx.fillText(fit(ctx, model.subtitle, W * 0.62), W - 40, 22);
  if (model.disclaimer) {
    ctx.textAlign = "left";
    ctx.font = "500 12px Figtree, sans-serif";
    ctx.fillStyle = model.predicted ? INK.accent : INK.faint;
    ctx.fillText(fit(ctx, model.disclaimer, W - 80), 40, 46);
  }

  const footerH = 100;
  const top = headerH + 6;
  const innerH = H - footerH - top;
  const count = 8;
  const cardH = Math.min(108, Math.floor((innerH - 7 * 8) / count));
  const gap = (innerH - count * cardH) / (count - 1);
  const octW = 700;
  const quarterW = 300;
  const semiW = 260;
  const finalW = 390;
  const join = 44;
  const xOct = 40;
  const xQuarter = xOct + octW + join;
  const xSemi = xQuarter + quarterW + join;
  const xFinal = xSemi + semiW + join;

  const matches = model.columns.flatMap((column) => column.pairs.flatMap((pair) => pair.matches));
  const octavos = matches.slice(0, count).map((match, index) => ({
    match,
    box: { x: xOct, y: top + index * (cardH + gap), w: octW, h: cardH } satisfies Box,
  }));

  const quarters = model.columns.flatMap((column) =>
    column.pairs.map((pair, index) => {
      const offset = column === model.columns[0] ? 0 : 4;
      const first = octavos[offset + index * 2]?.box;
      const second = octavos[offset + index * 2 + 1]?.box;
      const changed = pair.matches.some((match) => match.changed);
      const box =
        first && second
          ? centeredOn(first, second, xQuarter, quarterW, 104)
          : { x: xQuarter, y: top, w: quarterW, h: 104 };
      return { title: pair.next, a: feedLine(pair.matches[0]), b: feedLine(pair.matches[1]), box, changed };
    }),
  );

  const semis = model.columns.map((column, index) => {
    const pairA = quarters[index * 2];
    const pairB = quarters[index * 2 + 1];
    const changed = column.pairs.some((pair) => pair.matches.some((match) => match.changed));
    const box =
      pairA && pairB
        ? centeredOn(pairA.box, pairB.box, xSemi, semiW, 104)
        : { x: xSemi, y: top, w: semiW, h: 104 };
    return {
      title: index === 0 ? "S1" : "S2",
      a: `Ganador ${pairA?.title ?? ""}`.trim(),
      b: `Ganador ${pairB?.title ?? ""}`.trim(),
      box,
      changed,
    };
  });

  const finalBox =
    semis[0] && semis[1]
      ? centeredOn(semis[0].box, semis[1].box, xFinal, finalW, 236)
      : { x: xFinal, y: top, w: finalW, h: 236 };
  const anyChanged = matches.some((match) => match.changed);

  for (let index = 0; index < quarters.length; index += 1) {
    const quarter = quarters[index];
    const first = octavos[index * 2]?.box;
    const second = octavos[index * 2 + 1]?.box;
    if (quarter && first && second) drawJoin(ctx, first, second, quarter.box);
  }
  if (semis[0] && quarters[0] && quarters[1]) drawJoin(ctx, quarters[0].box, quarters[1].box, semis[0].box);
  if (semis[1] && quarters[2] && quarters[3]) drawJoin(ctx, quarters[2].box, quarters[3].box, semis[1].box);
  if (semis[0] && semis[1]) drawJoin(ctx, semis[0].box, semis[1].box, finalBox);

  for (const item of octavos) drawOctavos(ctx, item.match, crests, chicken, item.box);
  for (const item of quarters) drawLater(ctx, item.title, item.a, item.b, item.box, item.changed);
  for (const item of semis) drawLater(ctx, item.title, item.a, item.b, item.box, item.changed);
  drawFinal(ctx, finalBox, anyChanged);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "500 13px Figtree, sans-serif";
  ctx.fillStyle = INK.faint;
  ctx.fillText(model.stamp, W / 2, H - 78);
  ctx.fillStyle = INK.fg;
  ctx.font = "600 52px Oswald, sans-serif";
  ctx.fillText("pirata.app", W / 2, H - 40);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("No se pudo armar la imagen");
  return blob;
}

export type PublishResult = "shared" | "copied" | "downloaded" | "cancelled" | "wait";

export function shareChannel(input: {
  phone: boolean;
  blobReady: boolean;
  canShareFiles: boolean;
  canCopyImage: boolean;
}): "sheet" | "clipboard" | "wait" | "download" {
  if (input.phone && input.blobReady && input.canShareFiles) return "sheet";
  if (input.phone && !input.blobReady) return "wait";
  if (!input.phone && input.canCopyImage) return "clipboard";
  return "download";
}

export function prefersShareSheet(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return (
    window.matchMedia("(pointer: coarse)").matches && window.matchMedia("(max-width: 900px)").matches
  );
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function shareCancelled(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function pngBlob(blob: Blob): Blob {
  return blob.type === "image/png" ? blob : blob.slice(0, blob.size, "image/png");
}

/** ClipboardItem and navigator.share have to run inside the click, before any await. */
export function publishLlaveCard(source: Blob | Promise<Blob>): Promise<PublishResult> {
  const blobReady = source instanceof Blob;
  const pending = Promise.resolve(source);
  const file = blobReady ? new File([source], FILE_NAME, { type: "image/png" }) : null;
  const channel = shareChannel({
    phone: prefersShareSheet(),
    blobReady,
    canShareFiles: Boolean(
      file && typeof navigator.share === "function" && navigator.canShare?.({ files: [file] }),
    ),
    canCopyImage: typeof ClipboardItem !== "undefined" && Boolean(navigator.clipboard?.write),
  });

  if (channel === "sheet" && file && source instanceof Blob) {
    return navigator.share({ files: [file] }).then(
      () => "shared" as const,
      (error: unknown) => {
        if (shareCancelled(error)) return "cancelled" as const;
        downloadBlob(source, FILE_NAME);
        return "downloaded" as const;
      },
    );
  }

  if (channel === "wait") return Promise.resolve("wait");

  if (channel === "clipboard") {
    try {
      const payload = source instanceof Blob ? pngBlob(source) : pending.then(pngBlob);
      const item = new ClipboardItem({
        "image/png": payload,
      } as unknown as Record<string, Blob>);
      return navigator.clipboard.write([item]).then(
        () => "copied" as const,
        () =>
          pending.then((blob) => {
            downloadBlob(blob, FILE_NAME);
            return "downloaded" as const;
          }),
      );
    } catch {
      /* This browser wants a real Blob, not a promise. */
    }
  }

  return pending.then((blob) => {
    downloadBlob(blob, FILE_NAME);
    return "downloaded" as const;
  });
}
