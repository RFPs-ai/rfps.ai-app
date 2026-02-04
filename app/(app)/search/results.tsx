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
    <div className="space-y-10">
      {loading && (
        <div className="text-center text-neutral-500">
          Searching tenders…
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="text-center text-neutral-500">
          {emptyMessage}
        </div>
      )}

      {results.map((r, i) => (
        <div
          key={i}
          className="border-b border-neutral-800 pb-8"
        >
          {/* Title */}
          <h2 className="text-xl font-medium mb-1 text-neutral-600">
            {r.title}
          </h2>

          {/* Snippet */}
          {r.snippet && (
            <p className="text-neutral-400 mb-3 leading-relaxed">
              {r.snippet}
            </p>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
            <span className="inline-flex items-center rounded-full bg-neutral-900 border border-neutral-800 px-3 py-1 text-neutral-300">
              {formatSource(r.source)}
            </span>

            {r.dueDate && (
              <span className="text-neutral-500">
                Closing: {r.dueDate}
              </span>
            )}
          </div>

          {/* Link */}
          <a
            href={r.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-neutral-300 hover:text-neutral-100 hover:underline"
          >
            View original →
          </a>
        </div>
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
    case "merx":
      return "MERX";
    default:
      return source
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
