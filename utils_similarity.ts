// Very simple token Jaccard similarity for short answers.
// Returns 0..1 similarity.
export function jaccardSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const tokenize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);

  const sa = new Set(tokenize(a));
  const sb = new Set(tokenize(b));
  const inter = new Set([...sa].filter(x => sb.has(x)));
  const union = new Set([...sa, ...sb]);
  return union.size === 0 ? 0 : inter.size / union.size;
}