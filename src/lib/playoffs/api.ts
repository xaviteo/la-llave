import { createServerFn } from "@tanstack/react-start";
import type { PlayoffSnapshot } from "./types";

export const getPlayoffSnapshot = createServerFn({ method: "GET" }).handler(
  async (): Promise<PlayoffSnapshot> => {
    const { loadSnapshot } = await import("./load.server");
    return loadSnapshot();
  },
);
