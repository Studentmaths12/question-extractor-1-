export type Question = {
  id: number;
  raw: string;
  text: string;
  choices?: string[]; // if MCQ-like detected
};

const splitByNumbering = (text: string): string[] => {
  // Attempt to split by common numbered question patterns:
  // e.g. "1.", "1)", "Q1.", "Q1)", "1 -", "1 " at line starts
  const lines = text.split(/\r?\n/);
  const groups: string[] = [];
  let current = "";
  const questionStartRegex = /^\s*(?:Q?\d+[\.\)\-]|Question\s+\d+[:\.\)])\s*/i;

  for (const line of lines) {
    if (questionStartRegex.test(line)) {
      if (current.trim()) groups.push(current.trim());
      current = line.trim();
    } else {
      // If the line is empty and current already has content, keep blank as paragraph break
      current += (current ? " " : "") + line.trim();
    }
  }
  if (current.trim()) groups.push(current.trim());
  return groups;
};

const fallbackSplit = (text: string): string[] => {
  // Fallback: split by double newlines (paragraphs)
  return text.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
};

export function extractQuestionsFromText(text: string): Question[] {
  // Clean-up
  const cleaned = text.replace(/\t/g, " ").replace(/\u00A0/g, " ").trim();

  // Try numbered split first
  let blocks = splitByNumbering(cleaned);
  if (blocks.length < 2) {
    blocks = fallbackSplit(cleaned);
  }

  // Post process: if a block contains multiple numbered subitems, further split
  const final: Question[] = [];
  let id = 1;
  for (const blk of blocks) {
    // Try to split internal subquestions like "(a) ... (b) ..."
    const subparts = blk.split(/(?=\([a-z]\))/i);
    if (subparts.length > 1) {
      for (const sp of subparts) {
        const t = sp.trim();
        if (t) final.push({ id: id++, raw: t, text: t });
      }
    } else {
      final.push({ id: id++, raw: blk, text: blk });
    }
  }
  return final;
}