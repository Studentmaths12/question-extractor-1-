import React from "react";

type Props = {
  id: number;
  question: string;
  answer: string;
  onChange: (id: number, val: string) => void;
};

export default function QuestionCard({ id, question, answer, onChange }: Props) {
  return (
    <div style={{ border: "1px solid #ddd", padding: 12, marginBottom: 12 }}>
      <div style={{ fontWeight: 600 }}>Question {id}</div>
      <div style={{ margin: "8px 0" }}>{question}</div>
      <textarea
        value={answer}
        onChange={(e) => onChange(id, e.target.value)}
        placeholder="Type your answer here..."
        rows={4}
        style={{ width: "100%" }}
      />
    </div>
  );
}