// File: app/api/pdf-ingest/textParser.ts

/**
 * Example: parse raw PDF text into an array of question objects.
 * This is a "heuristic" approach. If your PDF is structured,
 * you can do more specific regex. If your PDF is messy,
 * consider using an LLM approach.
 */

export function parseTextIntoQuestions(rawText: string): ParsedQuestion[] {
    // 1) Split text into lines
    const lines = rawText.split("\n").map(l => l.trim()).filter(Boolean)
  
    // 2) We'll do a simple approach:
    //    - If line starts with "Q" or "Question" => new question
    //    - If line starts with "(a)", "(b)", etc. => sub-part
    //    - If line matches "Answer: X" => store correctOption
    //    - If line matches "Markscheme:" => store solution
    //
    //    This is extremely simplified. Real code might do more advanced checks.
  
    let questions: ParsedQuestion[] = []
    let currentQ: ParsedQuestion | null = null
  
    lines.forEach(line => {
      // Example detection of new question
      const qMatch = line.match(/^Q(uestion)?\s?(\d+)(:|\.)?\s?(.*)/i)
      if (qMatch) {
        // push old question if we have one
        if (currentQ) questions.push(currentQ)
  
        // Start new question
        currentQ = {
          questionId: `q${qMatch[2]}`,
          text: qMatch[4] || "", // remainder after "Q1"
          type: "unknown",
          options: [],
          markschemes: []
        }
        return
      }
  
      // If line looks like an MCQ option e.g. "(A)" or "A)" or "A."
      const optMatch = line.match(/^(\(?[A-D]\)?[\.\)\:]?)\s+(.*)/i)
      if (optMatch && currentQ) {
        // If we see A) Option text => assume type=mcq
        if (currentQ.type === "unknown" || currentQ.type === "short_answer") {
          currentQ.type = "mcq"
        }
        currentQ.options?.push(optMatch[2].trim())
        return
      }
  
      // If line looks like "Answer: B"
      const ansMatch = line.match(/^Answer:\s*(.*)/i)
      if (ansMatch && currentQ) {
        currentQ.correctOption = ansMatch[1].trim()
        // Could guess numeric or short if no options
        if (!currentQ.options?.length && /^\d+(\.\d+)?$/.test(currentQ.correctOption)) {
          currentQ.type = "numerical"
        }
        return
      }
  
      // If line includes "Markscheme:" or "Solution:"
      if (/^(Markscheme|Solution):/i.test(line) && currentQ) {
        const ms = line.replace(/^(Markscheme|Solution):\s*/i, "").trim()
        currentQ.markschemes?.push(ms)
        return
      }
  
      // If line looks like subpart "(a)" or "(b)"
      const subPartMatch = line.match(/^\(([a-z])\)\s+(.*)/i)
      if (subPartMatch && currentQ) {
        // We might store sub-part as a separate question or just append.
        currentQ.text += `\n\nPart (${subPartMatch[1]}): ${subPartMatch[2]}`
        return
      }
  
      // Otherwise, just append line to current question text
      if (currentQ) {
        currentQ.text += `\n${line}`
      }
    })
  
    // push last question
    if (currentQ) questions.push(currentQ)
  
    // 3) Final pass: guess type => if no options but numeric answer => "numerical"
    questions.forEach(q => {
      if (q.type === "unknown" && q.correctOption && /^\d+(\.\d+)?$/.test(q.correctOption)) {
        q.type = "numerical"
      }
      if (q.type === "unknown") {
        // default to "short_answer"
        q.type = "short_answer"
      }
    })
  
    // 4) We might detect difficulty or subject from certain keywords, etc.
    //    For demonstration, let's just set everything to "Math".
    questions.forEach(q => {
      q.subject = "Math"
      q.difficulty = "Medium"
    })
  
    // Return final array
    return questions
  }
  
  // The type of object we return from this parser
  export interface ParsedQuestion {
    questionId?: string
    text: string
    type: string
    options?: string[]
    correctOption?: string
    difficulty?: string
    subject?: string
    topic?: string
    year?: number
    markschemes?: string[] // multiple solutions
  }
  