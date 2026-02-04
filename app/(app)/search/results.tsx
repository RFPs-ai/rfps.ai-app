"use client";

export type TenderResult = {
  title: string;
  snippet?: string;
  source: string;
  sourceUrl: string;
  dueDate?: string;
};

type ResultsPanelProps = {
  results: TenderResult[];
  loading?: boolean;
  emptyMessage?: string;
};

export default function ResultsPanel({
  results,
  loading = false,
  emptyMessage = "No results yet — try a search above",
}: ResultsPanelProps) {
  return (
    <div className="space-y-4">
      {loading && (
        <div className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm">
          <div className="px-6 py-8 text-center text-sm text-slate-500">
            Searching tenders…
          </div>
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm">
          <div className="px-6 py-8 text-center text-sm text-slate-500">
            {emptyMessage}
          </div>
        </div>
      )}

      {!loading &&
        results.map((r, i) => (
          <article
            key={i}
            className="group relative rounded-2xl border border-neutral-200/60 bg-white shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
          >
            {/* subtle blue accent bar */}
            <div className="absolute left-0 top-6 h-12 w-[3px] rounded-full bg-blue-500/70" />

            <div className="p-6 pl-8">
              {/* Title */}
              <h2 className="text-[17px] font-semibold leading-snug text-slate-900 transition group-hover:text-blue-600">
                {r.title}
              </h2>

              {/* Snippet */}
              {r.snippet && (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {r.snippet}
                </p>
              )}

              {/* Metadata */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  {formatSource(r.source)}
                </span>

                {r.dueDate && (
                  <span className="text-xs text-slate-500">
                    Closing: {r.dueDate}
                  </span>
                )}
              </div>

              {/* Action */}
              <div className="mt-5">
                <a
                  href={r.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  View original
                  <span className="transition group-hover:translate-x-[1px]">→</span>
                </a>
              </div>
            </div>
          </article>
        ))}
    </div>
  );
}


function formatSource(source: string) {
  switch (source) {
    case "bids_tenders":
      return "Bids & Tenders";
    case "ontario_tenders":
      return "Ontario Tenders";
    case "canadabuys":
      return "CanadaBuys";
    default:
      return source
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
