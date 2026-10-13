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
  bg: "#B2CFD6",
  fg: "#101719",
  muted: "#34474D",
  faint: "#3A5259",
  line: "#243A40",
  cream: "#F3EEDF",
};

function fit(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let next = text;
  while (next.length > 1 && ctx.measureText(`${next}…`).width > max) next = next.slice(0, -1);
  return `${next}…`;
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


type Box = { x: number; y: number; w: number; h: number };


function drawPlainCrest(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  x: number,
  y: number,
  size: number,
) {
  if (!image) return;
  const scale = Math.min(size / image.width, size / image.height);
  const dw = image.width * scale;
  const dh = image.height * scale;
  ctx.drawImage(image, x + (size - dw) / 2, y + (size - dh) / 2, dw, dh);
}

function drawSideTeam(
  ctx: CanvasRenderingContext2D,
  team: CardTeam,
  crests: Map<string, HTMLImageElement>,
  chicken: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
  align: "left" | "right",
  host: boolean,
) {
  const crest = 32;
  const image = team.chicken ? chicken : (crests.get(team.logo) ?? null);
  const nameX = align === "left" ? x + crest + 10 : x;
  const nameW = w - crest - 10;
  ctx.textBaseline = "middle";
  ctx.textAlign = align === "left" ? "left" : "right";
  ctx.fillStyle = INK.fg;
  ctx.font = "600 20px Archivo, Arial, sans-serif";
  const label = host ? `${team.name}  Local` : team.name;
  const textX = align === "left" ? nameX : x + nameW;
  ctx.fillText(fit(ctx, label, nameW), textX, y + h / 2 - 8);
  ctx.fillStyle = INK.faint;
  ctx.font = "500 13px Archivo, Arial, sans-serif";
  ctx.fillText(team.detail, textX, y + h / 2 + 12);
  drawPlainCrest(
    ctx,
    image,
    align === "left" ? x : x + w - crest,
    y + (h - crest) / 2,
    crest,
  );
}

function drawOpenMatch(
  ctx: CanvasRenderingContext2D,
  match: CardMatch,
  crests: Map<string, HTMLImageElement>,
  chicken: HTMLImageElement | null,
  box: Box,
  align: "left" | "right",
) {
  if (match.changed) {
    ctx.fillStyle = INK.cream;
    ctx.fillRect(box.x, box.y, box.w, box.h);
  }
  const rowH = (box.h - 18) / 2;
  match.teams.forEach((team, index) => {
    drawSideTeam(ctx, team, crests, chicken, box.x, box.y + index * rowH, box.w, rowH, align, index === 0);
  });
  ctx.strokeStyle = INK.line;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.moveTo(box.x, box.y + box.h - 1);
  ctx.lineTo(box.x + box.w, box.y + box.h - 1);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawDefined(
  ctx: CanvasRenderingContext2D,
  title: string,
  box: Box,
) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = INK.faint;
  ctx.font = "600 12px Archivo, Arial, sans-serif";
  ctx.fillText(title, box.x + box.w / 2, box.y + 16);
  ctx.fillStyle = INK.fg;
  ctx.font = "600 18px Archivo, Arial, sans-serif";
  ctx.fillText("A definir", box.x + box.w / 2, box.y + box.h / 2);
}

function elbow(
  ctx: CanvasRenderingContext2D,
  from: [Box, Box] | [Box],
  to: Box,
  direction: "ltr" | "rtl",
  dashed: boolean,
) {
  ctx.save();
  ctx.strokeStyle = INK.line;
  ctx.lineWidth = 1.25;
  ctx.setLineDash(dashed ? [6, 5] : []);
  const [a, b] = from;
  if (!a) {
    ctx.restore();
    return;
  }
  if (!b) {
    const x1 = direction === "ltr" ? a.x + a.w : a.x;
    const x2 = direction === "ltr" ? to.x : to.x + to.w;
    const y = a.y + a.h / 2;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, to.y + to.h / 2);
    ctx.stroke();
    ctx.restore();
    return;
  }
  const x1 = direction === "ltr" ? a.x + a.w : a.x;
  const x2 = direction === "ltr" ? to.x : to.x + to.w;
  const mid = (x1 + x2) / 2;
  const y1 = a.y + a.h / 2;
  const y2 = b.y + b.h / 2;
  const yTo = to.y + to.h / 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(mid, y1);
  ctx.lineTo(mid, y2);
  ctx.lineTo(x1, y2);
  ctx.moveTo(mid, yTo);
  ctx.lineTo(x2, yTo);
  ctx.stroke();
  ctx.restore();
}

export async function renderLlavePng(
  data: Pick<PlayoffSnapshot, "tournament" | "roundLabel" | "updatedAt" | "octavos">,
  options: { predicted: boolean; live: boolean; projected: boolean; changedIds?: ReadonlySet<string> },
): Promise<Blob> {
  const model = buildLlaveCardModel(data, options);
  await document.fonts.load("600 22px Archivo");
  await document.fonts.load("500 16px Archivo");
  await document.fonts.ready;

  const chicken = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(GALLINA_SVG)}`);
  const crests = await loadCrests(model);
  const cup = await loadImage("/brand/copa-lpf.png");

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo armar la imagen");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.fillStyle = INK.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = INK.fg;
  ctx.font = "700 28px Archivo, Arial, sans-serif";
  ctx.fillText(fit(ctx, data.tournament, 720), 54, 42);
  ctx.textAlign = "right";
  ctx.font = "600 18px Archivo, Arial, sans-serif";
  ctx.fillText(options.predicted ? "Simulación" : "Actual", W - 54, 36);
  ctx.fillStyle = INK.faint;
  ctx.font = "500 15px Archivo, Arial, sans-serif";
  ctx.fillText(model.stamp || data.roundLabel, W - 54, 60);
  if (model.disclaimer) {
    ctx.textAlign = "left";
    ctx.fillText(fit(ctx, model.disclaimer, W - 120), 54, 78);
  }

  const top = 118;
  const rowH = 156;
  const gap = 36;
  const octW = 340;
  const laterW = 180;
  const xL = 54;
  const xR = W - 54 - octW;
  const yOf = (index: number) => top + index * (rowH + gap);
  const pairBox = (first: number, second: number, x: number, w: number, h: number): Box => {
    const mid = (yOf(first) + rowH / 2 + yOf(second) + rowH / 2) / 2;
    return { x, y: mid - h / 2, w, h };
  };

  const left = model.columns[0]?.pairs.flatMap((pair) => pair.matches) ?? [];
  const right = model.columns[1]?.pairs.flatMap((pair) => pair.matches) ?? [];
  const leftBoxes = left.slice(0, 4).map((match, index) => ({
    match,
    box: { x: xL, y: yOf(index), w: octW, h: rowH } satisfies Box,
  }));
  const rightBoxes = right.slice(0, 4).map((match, index) => ({
    match,
    box: { x: xR, y: yOf(index), w: octW, h: rowH } satisfies Box,
  }));

  const quarters = [
    { title: "C1", box: pairBox(0, 1, 430, laterW, 92), sources: [leftBoxes[0]?.box, leftBoxes[1]?.box], changed: left.slice(0, 2).some((match) => match.changed), direction: "ltr" as const },
    { title: "C4", box: pairBox(2, 3, 430, laterW, 92), sources: [leftBoxes[2]?.box, leftBoxes[3]?.box], changed: left.slice(2, 4).some((match) => match.changed), direction: "ltr" as const },
    { title: "C2", box: pairBox(0, 1, W - 430 - laterW, laterW, 92), sources: [rightBoxes[0]?.box, rightBoxes[1]?.box], changed: right.slice(0, 2).some((match) => match.changed), direction: "rtl" as const },
    { title: "C3", box: pairBox(2, 3, W - 430 - laterW, laterW, 92), sources: [rightBoxes[2]?.box, rightBoxes[3]?.box], changed: right.slice(2, 4).some((match) => match.changed), direction: "rtl" as const },
  ];
  const semiH = 92;
  const semiL = pairBox(0, 3, 648, laterW, semiH);
  const semiR = pairBox(0, 3, W - 648 - laterW, laterW, semiH);
  const finalW = 220;
  const finalBox: Box = {
    x: (W - finalW) / 2,
    y: (semiL.y + semiR.y) / 2,
    w: finalW,
    h: semiH,
  };

  const join = (
    sources: Array<Box | undefined>,
    to: Box,
    direction: "ltr" | "rtl",
    dashed: boolean,
  ) => {
    const ready = sources.filter((item): item is Box => Boolean(item));
    if (ready.length === 0) return;
    elbow(ctx, ready as [Box, Box] | [Box], to, direction, dashed);
  };

  join(quarters[0]?.sources ?? [], quarters[0]?.box ?? finalBox, "ltr", Boolean(quarters[0]?.changed));
  join(quarters[1]?.sources ?? [], quarters[1]?.box ?? finalBox, "ltr", Boolean(quarters[1]?.changed));
  join([quarters[0]?.box, quarters[1]?.box], semiL, "ltr", Boolean(quarters[0]?.changed || quarters[1]?.changed));
  join(quarters[2]?.sources ?? [], quarters[2]?.box ?? finalBox, "rtl", Boolean(quarters[2]?.changed));
  join(quarters[3]?.sources ?? [], quarters[3]?.box ?? finalBox, "rtl", Boolean(quarters[3]?.changed));
  join([quarters[2]?.box, quarters[3]?.box], semiR, "rtl", Boolean(quarters[2]?.changed || quarters[3]?.changed));
  join([semiL], finalBox, "ltr", left.some((match) => match.changed));
  join([semiR], finalBox, "rtl", right.some((match) => match.changed));

  for (const item of leftBoxes) drawOpenMatch(ctx, item.match, crests, chicken, item.box, "left");
  for (const item of rightBoxes) drawOpenMatch(ctx, item.match, crests, chicken, item.box, "right");
  for (const item of quarters) if (item.box) drawDefined(ctx, item.title, item.box);
  drawDefined(ctx, "S1", semiL);
  drawDefined(ctx, "S2", semiR);
  drawDefined(ctx, "Final", finalBox);
  if (cup) {
    const height = 210;
    const width = (cup.width / cup.height) * height;
    ctx.drawImage(cup, finalBox.x + (finalBox.w - width) / 2, finalBox.y - height - 12, width, height);
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = INK.faint;
  ctx.font = "500 16px Archivo, Arial, sans-serif";
  ctx.fillText("MATA MATA", 54, H - 36);
  ctx.textAlign = "right";
  ctx.fillText("pirata.app", W - 54, H - 36);

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
