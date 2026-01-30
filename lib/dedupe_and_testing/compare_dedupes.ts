import fs from "fs";
import crypto from "crypto";
import { minhashLSHDedupe } from "./minhash-dedupe";

type Tender = {
  source: string;
  sourceId: string;
  sourceUrl: string;
  title: string;
  buyerName?: string;
  bidNumber?: string;
  dueDate?: string;
  description?: string;
};

function norm(s?: string) {
  return (s ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}
function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

const inputFile = "tenders_test.jsonl";
const lines = fs.readFileSync(inputFile, "utf8").trim().split("\n");
const tenders: Tender[] = lines.map((l) => JSON.parse(l));

const items = tenders.map((t, idx) => ({
  id: `${t.source}:${t.sourceId || idx}`,
  tender: t,
}));

// SHA "exact" clusters
const shaGroups = new Map<string, string[]>();

for (const it of items) {
  const t = it.tender;
  const buyerIdentity = norm(t.buyerName);
  const solicitation = norm(t.bidNumber) || norm(t.sourceId);
  const title = norm(t.title);
  const due = norm(t.dueDate);

  const fp = sha256([buyerIdentity, solicitation, title, due].join("|"));
  const arr = shaGroups.get(fp) ?? [];
  arr.push(it.id);
  shaGroups.set(fp, arr);
}

const shaClusters = [...shaGroups.values()].filter((g) => g.length >= 2);

// MinHash clusters
const mh = minhashLSHDedupe(items, {
  numHashes: 128,
  bands: 32,
  shingleK: 3,
  similarityThreshold: 0.85,
});
const mhClusters = [...mh.clusters.values()];

// convert clusters -> duplicate pairs
function clustersToPairs(clusters: string[][]) {
  const pairs = new Set<string>();
  for (const g of clusters) {
    for (let i = 0; i < g.length; i++) {
      for (let j = i + 1; j < g.length; j++) {
        const a = g[i], b = g[j];
        pairs.add(a < b ? `${a}|${b}` : `${b}|${a}`);
      }
    }
  }
  return pairs;
}

const shaPairs = clustersToPairs(shaClusters);
const mhPairs = clustersToPairs(mhClusters);

let agree = 0;
for (const p of mhPairs) if (shaPairs.has(p)) agree++;

const onlyMh = [...mhPairs].filter((p) => !shaPairs.has(p));
const onlySha = [...shaPairs].filter((p) => !mhPairs.has(p));

console.log("Input file:", inputFile);
console.log("Total tenders:", items.length);
console.log("SHA clusters:", shaClusters.length, "pairs:", shaPairs.size);
console.log("MinHash clusters:", mhClusters.length, "pairs:", mhPairs.size);
console.log("Agree pairs:", agree);
console.log("Only MinHash pairs:", onlyMh.length);
console.log("Only SHA pairs:", onlySha.length);

// save disagreements for inspection
fs.writeFileSync(
  "dedupe_disagreements.json",
  JSON.stringify(
    {
      onlyMinhashPairs: onlyMh.slice(0, 500),
      onlyShaPairs: onlySha.slice(0, 500),
    },
    null,
    2
  ),
  "utf8"
);

console.log("Wrote dedupe_disagreements.json (capped at 500 pairs each)");
