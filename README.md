# Exam Extractor — Prototype

A simple exam app prototype that:
- Accepts an uploaded scanned exam paper image (or photo).
- Runs OCR in the browser (Tesseract.js).
- Heuristically extracts questions from the OCR text.
- Displays questions one-by-one / question-wise.
- Lets user input answers and grade them using:
  - built-in string-similarity (fast, offline), or
  - optional OpenAI grading (more robust; requires OPENAI_API_KEY set on the server).

Run:
1. Install:
   npm install

2. Dev:
   npm run dev
   Open http://localhost:3000

3. Optional: To enable OpenAI grading:
   - Create a .env.local with:
     OPENAI_API_KEY=your_api_key_here

Notes:
- This prototype focuses on flow & heuristics. For production:
  - add better PDF support (convert pages to images server-side) or use a cloud OCR (Google Vision/Azure).
  - improve question segmentation via fine-tuned NLP / sequence labeling.
  - for grading, use answer keys or embeddings + semantic similarity / rubric prompts.