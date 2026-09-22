export function HowItWorks() {
  return (
    <section className="rounded-xl bg-surface p-4 shadow-[0_0_0_1px_rgba(238,242,244,0.08)] sm:p-5">
      <h2 className="font-display text-xl tracking-wide">Cómo se cruzan</h2>
      <div className="mt-3 grid gap-4 text-sm leading-relaxed text-muted md:grid-cols-3">
        <div>
          <h3 className="mb-1 font-display text-base tracking-wide text-fg">Octavos</h3>
          <p>
            Clasifican los 8 primeros de cada zona. Partido único: 1°A vs 8°B, 1°B vs 8°A, 2°A vs
            7°B, y así hasta 4° vs 5°. Localía en el estadio del mejor ubicado en la fase de zonas.
          </p>
        </div>
        <div>
          <h3 className="mb-1 font-display text-base tracking-wide text-fg">Camino a la final</h3>
          <p>
            Cuartos: P1–P8, P2–P7, P3–P6 y P4–P5. Semis: C1–C4 y C2–C3. Final en sede de la LPF. Si
            hay empate a los 90, alargue de 30 y penales.
          </p>
        </div>
        <div>
          <h3 className="mb-1 font-display text-base tracking-wide text-fg">La tabla</h3>
          <p>
            Desempate: diferencia de gol, goles a favor, partidos entre sí, fair play y sorteo. Un
            club en zona de descenso en el Clausura no puede jugar el mata-mata: entra el siguiente.
          </p>
        </div>
      </div>
    </section>
  );
}
