import { sites } from "./sites";

export default function Home() {
  return (
    <main>
      <section className="border-b border-line">
        <div className="container-page py-20 sm:py-28">
          <p className="font-mono text-sm uppercase tracking-widest text-green">
            OrbitBoyzz
          </p>
          <h1 className="mt-4 font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl">
            Websites we&rsquo;ve built.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            We find local businesses running without a real web presence and
            build them fast, modern, hand-coded sites — no page-builders, no
            templates. Here&rsquo;s the work.
          </p>
        </div>
      </section>

      <section className="container-page py-16 sm:py-20">
        <div className="grid gap-8 sm:grid-cols-2">
          {sites.map((site) => (
            <article
              key={site.name}
              className="group rounded-2xl border border-line bg-card p-8 transition-colors hover:border-green"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl tracking-tight">
                    {site.name}
                  </h2>
                  <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted">
                    {site.client}
                    {site.location ? ` · ${site.location}` : ""}
                  </p>
                </div>
                {site.spec && (
                  <span className="shrink-0 rounded-full bg-lime px-3 py-1 font-mono text-xs uppercase tracking-widest text-dark">
                    Concept build
                  </span>
                )}
              </div>

              <p className="mt-5 text-lg font-medium text-ink">
                {site.tagline}
              </p>
              <p className="mt-3 text-muted">{site.description}</p>

              <ul className="mt-5 flex flex-wrap gap-2">
                {site.tech.map((t) => (
                  <li
                    key={t}
                    className="rounded-full border border-line px-3 py-1 font-mono text-xs text-muted"
                  >
                    {t}
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex gap-4">
                {site.live && (
                  <a
                    href={site.live}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-green px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
                  >
                    View live site →
                  </a>
                )}
                {site.code && (
                  <a
                    href={site.code}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-green hover:text-green"
                  >
                    View code
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="container-page flex flex-col items-start justify-between gap-4 py-10 sm:flex-row sm:items-center">
          <p className="font-mono text-sm text-muted">
            OrbitBoyzz — hand-coded sites for local businesses.
          </p>
          <a
            href="mailto:orbitwebsites@gmail.com"
            className="font-mono text-sm text-green underline underline-offset-4"
          >
            orbitwebsites@gmail.com
          </a>
        </div>
      </footer>
    </main>
  );
}
