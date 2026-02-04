import crypto from "crypto";

export type TenderLike = {
  source?: string;
  sourceId?: string;
  sourceUrl?: string;
  title?: string;
  buyerName?: string;
  description?: string;
  dueDate?: string;
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[\u2019']/g, "'")
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordShingles(text: string, k = 3): string[] {
  const words = normalize(text).split(" ").filter(Boolean);
  if (words.length < k) return [];
  const shingles: string[] = [];
  for (let i = 0; i <= words.length - k; i++) {
    shingles.push(words.slice(i, i + k).join(" "));
  }
  return shingles;
}

function hash32(input: string, seed: number): number {
  const h = crypto.createHash("sha256");
  h.update(String(seed));
  h.update("|");
  h.update(input);
  const buf = h.digest();
  return buf.readUInt32BE(0);
}

export function minhashSignature(tokens: string[], numHashes = 128): number[] {
  const sig = Array(numHashes).fill(0xffffffff);

  for (let i = 0; i < numHashes; i++) {
    let min = 0xffffffff;
    for (const t of tokens) {
      const hv = hash32(t, i);
      if (hv < min) min = hv;
    }
    sig[i] = min;
  }

  return sig;
}

export function signatureSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("Signature length mismatch");
  let same = 0;
  for (let i = 0; i < a.length; i++) if (a[i] === b[i]) same++;
  return same / a.length;
}

function bandHash(sig: number[], start: number, rows: number): string {
  const slice = sig.slice(start, start + rows).join(",");
  return crypto.createHash("sha1").update(slice).digest("hex");
}

export type MinhashResult = {
  clusters: Map<string, string[]>;
  candidatePairs: Array<[string, string]>;
  signatures: Map<string, number[]>;
};

export function minhashLSHDedupe(
  items: Array<{ id: string; tender: TenderLike }>,
  opts?: {
    numHashes?: number;
    bands?: number;
    shingleK?: number;
    similarityThreshold?: number;
  }
): MinhashResult {
  const numHashes = opts?.numHashes ?? 128;
  const bands = opts?.bands ?? 32;
  const rowsPerBand = Math.floor(numHashes / bands);
  const shingleK = opts?.shingleK ?? 3;
  const similarityThreshold = opts?.similarityThreshold ?? 0.85;

  if (rowsPerBand * bands !== numHashes) {
    throw new Error("numHashes must be divisible by bands");
  }

  const signatures = new Map<string, number[]>();
  const buckets = new Map<string, string[]>();

  for (const { id, tender } of items) {
    const text = [tender.title ?? "", tender.buyerName ?? "", tender.description ?? ""].join(" ");
    const shingles = wordShingles(text, shingleK);
    const sig = minhashSignature(shingles, numHashes);
    signatures.set(id, sig);

    for (let b = 0; b < bands; b++) {
      const start = b * rowsPerBand;
      const key = `${b}:${bandHash(sig, start, rowsPerBand)}`;
      const arr = buckets.get(key) ?? [];
      arr.push(id);
      buckets.set(key, arr);
    }
  }

  const candidateSet = new Set<string>();
  const candidatePairs: Array<[string, string]> = [];

  for (const ids of buckets.values()) {
    if (ids.length < 2) continue;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i], b = ids[j];
        const key = a < b ? `${a}|${b}` : `${b}|${a}`;
        if (candidateSet.has(key)) continue;
        candidateSet.add(key);
        candidatePairs.push(a < b ? [a, b] : [b, a]);
      }
    }
  }

  // union-find
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    const p = parent.get(x) ?? x;
    if (p === x) return x;
    const r = find(p);
    parent.set(x, r);
    return r;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(rb, ra);
  };

  // verify candidates by signature similarity
  for (const [a, b] of candidatePairs) {
    const sa = signatures.get(a)!;
    const sb = signatures.get(b)!;
    const sim = signatureSimilarity(sa, sb);
    if (sim >= similarityThreshold) union(a, b);
  }

  // build clusters
  const clusters = new Map<string, string[]>();
  for (const { id } of items) {
    const root = find(id);
    const arr = clusters.get(root) ?? [];
    arr.push(id);
    clusters.set(root, arr);
  }

  // keep only clusters with size >= 2
  for (const [k, v] of [...clusters.entries()]) {
    if (v.length < 2) clusters.delete(k);
  }

  return { clusters, candidatePairs, signatures };
}
