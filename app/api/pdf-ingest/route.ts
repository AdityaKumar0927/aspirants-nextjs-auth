import { NextResponse } from "next/server"
import prisma from "@/lib/prisma" // default export from your prisma.ts
import type { IncomingMessage } from "http"

// If no @types/formidable installed, do: declare module "formidable" in a .d.ts
import formidable, { Fields, Files, File as FormidableFile } from "formidable"
import { createWorker } from "tesseract.js"
// If you have @types/pdf-parse installed, you can import properly:
import pdfParse from "pdf-parse"

/**
 * We must disable bodyParser in Next.js routes:
 */
export const config = {
  api: {
    bodyParser: false,
  },
}

// The main POST handler
export async function POST(req: Request) {
  try {
    // 1) Convert Next.js 13 Request into a Node.js IncomingMessage
    //    so we can pass it to formidable. We'll define a helper below.
    const incReq = await toIncomingMessage(req)
    if (!incReq) {
      return NextResponse.json({ error: "No request body" }, { status: 400 })
    }

    // 2) Parse the form with formidable (single file scenario)
    const { fields, files } = await parseForm(incReq)
    // formidable always returns an object of { [fieldName]: File|File[] }
    // For single-file usage with field name "pdfFile", let's handle that carefully
    const uploaded = files.pdfFile
    if (!uploaded) {
      return NextResponse.json({ error: "No pdfFile in form data" }, { status: 400 })
    }

    // If 'multiples: false', 'uploaded' might be a single FormidableFile object, or an array
    let pdfFile: FormidableFile
    if (Array.isArray(uploaded)) {
      // If it's an array, take the first file
      pdfFile = uploaded[0]
    } else {
      pdfFile = uploaded
    }

    // Now we can safely access pdfFile.filepath
    if (!pdfFile.filepath) {
      return NextResponse.json({ error: "pdfFile has no filepath" }, { status: 400 })
    }

    // 3) Read the PDF data
    const fs = await import("fs/promises")
    const fileBuffer = await fs.readFile(pdfFile.filepath)

    // 4) Try extracting text with pdf-parse
    let parsedText = ""
    try {
      const parsed = await pdfParse(fileBuffer)
      if (parsed.text) parsedText = parsed.text.trim()
    } catch (err) {
      console.error("pdf-parse error:", err)
    }

    // If no text, fallback to OCR
    if (!parsedText || parsedText.length < 10) {
      parsedText = await doOcrWithTesseract(fileBuffer)
    }

    if (!parsedText || parsedText.length < 10) {
      return NextResponse.json({ error: "Unable to extract text from PDF" }, { status: 400 })
    }

    // 5) Parse the raw text into question data
    // For demonstration, we just produce one question with multiple markschemes
    const questionObjects = [
      {
        questionId: "exampleQ1",
        text: "Parsed question text from PDF",
        type: "mcq",
        options: ["Option A", "Option B"],
        correctOption: "A",
        markschemes: ["solution 1", "partial-credit approach"],
      },
    ]

    // 6) Insert them into DB
    let createdCount = 0
    for (const q of questionObjects) {
      const createdQ = await prisma.question.create({
        data: {
          questionId: q.questionId,
          text: q.text,
          type: q.type,
          options: q.options,
          correctOption: q.correctOption,
          status: "DRAFT",
        },
      })
      // Insert Markschemes
      if (q.markschemes) {
        for (const ms of q.markschemes) {
          await prisma.markscheme.create({
            data: {
              questionId: createdQ.id,
              content: ms,
            },
          })
        }
      }
      createdCount++
    }

    return NextResponse.json({ message: "PDF ingestion complete", createdCount })
  } catch (error: any) {
    console.error("Error in pdf-ingest route:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}

/**
 * Helper: Convert Next.js 13 `Request` to a Node.js `IncomingMessage`,
 * so we can use formidable normally. We'll read the request body chunk by chunk
 * and push into a PassThrough stream with necessary headers.
 */
import { PassThrough } from "stream"
class RequestStream extends PassThrough implements IncomingMessage {
  // implement minimal IncomingMessage properties if needed
  httpVersion = "1.1"
  httpVersionMajor = 1
  httpVersionMinor = 1
  connection = null as any
  headers: Record<string, string>
  trailers = {}
  url: string
  method: string

  constructor(url: string, method: string, headers: Record<string, string>) {
    super()
    this.url = url
    this.method = method
    this.headers = headers
  }
}

async function toIncomingMessage(req: Request): Promise<IncomingMessage | null> {
  if (!req.body) return null

  // Create a custom IncomingMessage
  const inc = new RequestStream(req.url, req.method ?? "POST", Object.fromEntries(req.headers))

  // Pump the raw body from Request into inc
  const reader = req.body.getReader()
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    inc.write(value)
  }
  inc.end()
  return inc
}

/**
 * Parse the form with formidable, given an IncomingMessage
 */
function parseForm(inc: IncomingMessage): Promise<{ fields: Fields; files: Files }> {
  const form = formidable({
    multiples: false,
    // If you want to store the file in tmp, or define uploadDir, etc.
  })
  return new Promise((resolve, reject) => {
    form.parse(inc, (err, fields, files) => {
      if (err) return reject(err)
      resolve({ fields, files })
    })
  })
}

/**
 * Tesseract OCR
 */
async function doOcrWithTesseract(fileBuffer: Buffer): Promise<string> {
  // createWorker returns a Worker (not a promise),
  // so do NOT do `await createWorker()`.
  const worker = createWorker()
  try {
    await worker.load()
    await worker.loadLanguage("eng")
    await worker.initialize("eng")

    const {
      data: { text },
    } = await worker.recognize(fileBuffer)
    await worker.terminate()
    return text.trim()
  } catch (err) {
    console.error("Tesseract OCR error:", err)
    await worker.terminate().catch(() => null)
    return ""
  }
}
