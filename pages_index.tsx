import React, { useState } from "react";
import Tesseract from "tesseract.js";
import { extractQuestionsFromText, Question } from "../utils/extractQuestions";
import QuestionCard from "../components/QuestionCard";
import { jaccardSimilarity } from "../utils/similarity";
import axios from "axios";

export default function Home() {
  const [ocrText, setOcrText] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [scores, setScores] = useState<Record<number, number>>({});
  const [status, setStatus] = useState<string>("");

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setLoading(true);
    setStatus("Running OCR (this can take a few seconds)...");
    try {
      const worker = await Tesseract.createWorker({
        logger: m => {
          // optional: progress logs
          // console.log(m);
        }
      });
      await worker.loadLanguage("eng");
      await worker.initialize("eng");
      const { data } = await worker.recognize(file);
      await worker.terminate();
      setOcrText(data.text);
      const qs = extractQuestionsFromText(data.text);
      setQuestions(qs);
      // prefill answers empty
      const a: Record<number, string> = {};
      qs.forEach(q => (a[q.id] = ""));
      setAnswers(a);
      setStatus(`Extracted ${qs.length} question(s).`);
    } catch (err) {
      setStatus("OCR failed: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  const onAnswerChange = (id: number, val: string) => {
    setAnswers(prev => ({ ...prev, [id]: val }));
  };

  const gradeLocal = () => {
    // Local grading: you need to provide an "answer key" in a prompt or text field.
    // For this prototype we'll ask user to enter model answers inline via a prompt.
    const key = prompt("Enter model answers as lines in order, separated by newline (1 per question).");
    if (key == null) return;
    const lines = key.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (lines.length === 0) {
      alert("No model answers provided.");
      return;
    }
    const newScores: Record<number, number> = {};
    questions.forEach((q, idx) => {
      const model = lines[idx] || "";
      const user = answers[q.id] || "";
      const sim = jaccardSimilarity(model, user);
      newScores[q.id] = Math.round(sim * 100); // percent
    });
    setScores(newScores);
  };

  const gradeWithOpenAI = async () => {
    // This calls /api/grade. The server route uses OPENAI_API_KEY if configured.
    setStatus("Requesting grading from server...");
    setLoading(true);
    try {
      const payload = {
        questions,
        answers,
      };
      const res = await axios.post("/api/grade", payload);
      if (res.data && res.data.scores) {
        setScores(res.data.scores);
        setStatus("Grading completed by server.");
      } else {
        setStatus("Server grading returned no scores.");
      }
    } catch (err: any) {
      setStatus("Grading request failed: " + (err?.response?.data?.error || err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "20px auto", padding: 20 }}>
      <h1>Exam Extractor (Prototype)</h1>

      <div style={{ marginBottom: 12 }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <div style={{ color: "#666", fontSize: 14, marginTop: 6 }}>
          Upload an image or photo of the exam paper. OCR runs locally in your browser.
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <button onClick={gradeLocal} disabled={questions.length === 0 || loading}>
          Grade locally with model answers
        </button>{" "}
        <button onClick={gradeWithOpenAI} disabled={questions.length === 0 || loading}>
          Grade using server (OpenAI optional)
        </button>
      </div>

      <div style={{ marginBottom: 12, color: "#333" }}>
        Status: {status} {loading ? " (working...)" : ""}
      </div>

      {questions.length > 0 && (
        <div>
          <h2>Questions</h2>
          {questions.map(q => (
            <div key={q.id}>
              <QuestionCard
                id={q.id}
                question={q.text}
                answer={answers[q.id] ?? ""}
                onChange={onAnswerChange}
              />
              {scores[q.id] != null && (
                <div style={{ marginBottom: 20 }}>Score: {scores[q.id]}%</div>
              )}
            </div>
          ))}
        </div>
      )}

      {ocrText && (
        <div style={{ marginTop: 20 }}>
          <h3>Raw OCR text</h3>
          <pre style={{ whiteSpace: "pre-wrap", background: "#f6f6f6", padding: 12 }}>{ocrText}</pre>
        </div>
      )}
    </div>
  );
}