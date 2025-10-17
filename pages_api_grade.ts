import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

type Q = {
  id: number;
  raw: string;
  text: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Expects { questions: Q[], answers: { [id]: string } }
  const body = req.body;
  const questions: Q[] = body.questions || [];
  const answers: Record<string, string> = body.answers || {};

  // If OPENAI_API_KEY is configured, call OpenAI to grade with a rubric prompt.
  // Otherwise, return an error or fallback.
  if (!process.env.OPENAI_API_KEY) {
    res.status(200).json({
      message: "OPENAI_API_KEY not configured. Server cannot do LLM grading.",
      scores: {},
    });
    return;
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    // Build a compact prompt: for each Q, include question and student's answer,
    // ask the model for a score 0-100 and a short justification.
    const items = questions.map(q => {
      const student = answers[q.id] ?? "";
      return `Q${q.id}: ${q.text}\nStudent Answer: ${student}\n`;
    }).join("\n---\n");

    const prompt = `You are an exam grader. For each question below, give a score between 0 and 100 and a one-sentence justification. Output JSON of the form {"scores": {"1": 90, "2": 50}, "notes": {"1": "Good", "2": "Missing ..."}}.

${items}

Return only valid JSON.`;

    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
    });

    const text = resp.choices?.[0]?.message?.content ?? "";
    // Try to parse JSON from returned text
    const jsonStart = text.indexOf("{");
    const json = jsonStart >= 0 ? text.slice(jsonStart) : text;
    const parsed = JSON.parse(json);
    res.status(200).json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: String(err) });
  }
}