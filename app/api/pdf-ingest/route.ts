// app/api/pdf-ingest/route.ts

import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"       // Make sure your prisma.ts exports a default
import pdfParse from "pdf-parse"
import { createWorker } from "tesseract.js"

// If you want Node-based runtime
export const runtime = "nodejs"

/**
 * POST /api/pdf-ingest
 *
 * Expects a multipart form with field "pdfFile" containing the PDF.
 * - We attempt to parse text with pdf-parse.
 * - If that fails or yields minimal text, we fallback to Tesseract OCR.
 * - Finally, we store the text in 'text' and a sample string in 'markscheme'.
 */
export async function POST(req: Request) {
  try {
    // 1) Use Next.js 13 API to get form data
    const formData = await req.formData()
    const pdfFile = formData.get("pdfFile") as File | null
    if (!pdfFile) {
      return NextResponse.json(
        { error: "No 'pdfFile' field provided in form data" },
        { status: 400 }
      )
    }

    // 2) Convert File -> Buffer
    const arrayBuffer = await pdfFile.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    // 3) Attempt text extraction with pdf-parse
    let rawText = ""
    try {
      const parsed = await pdfParse(fileBuffer)
      if (parsed.text) {
        rawText = parsed.text.trim()
      }
    } catch (err) {
      console.error("pdf-parse error:", err)
      // If pdf-parse fails, we rely on OCR fallback below
    }

    // 4) If minimal or no text, do OCR with Tesseract
    if (rawText.length < 10) {
      console.log("No readable text from pdf-parse; falling back to Tesseract OCR...")
      rawText = await doOcrWithTesseract(fileBuffer)
    }

    if (!rawText || rawText.length < 10) {
      return NextResponse.json(
        { error: "Failed to extract text from PDF (even with OCR)." },
        { status: 400 }
      )
    }

    // 5) For demonstration, we just create ONE question
    //    In real usage, you'd parse 'rawText' into multiple question objects.
    //    We'll store some text in 'text' and a sample solution in 'markscheme'.
    const questionId = `pdf_ingest_${Date.now()}`
    const newQuestion = await prisma.question.create({
      data: {
        questionId,
        text: rawText.slice(0, 2000),  // store up to ~2000 chars if huge
        markscheme: "Sample solution / explanation stored here.",
        status: "DRAFT",
        reviewed: false,
        type: "mcq",    // or guess from raw text
        options: [],    // if you find MCQ options, store them here
        correctOption: null,
      },
    })

    return NextResponse.json({
      message: "PDF ingestion complete",
      createdQuestion: newQuestion,
    })
  } catch (error: any) {
    console.error("Error in pdf-ingest route:", error)
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    )
  }
}

/**
 * Minimal Tesseract OCR approach.
 * If the PDF is multi-page, you'd typically convert each page to an image
 * and run Tesseract on each. This example does a single pass on the raw PDF buffer.
 */
async function doOcrWithTesseract(fileBuffer: Buffer): Promise<string> {
  // createWorker() returns a Worker object, not a promise, so do not do `await createWorker()`
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
    // try to terminate in case of error
    await worker.terminate().catch(() => null)
    return ""
  }
}
