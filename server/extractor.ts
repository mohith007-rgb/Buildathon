import path from "node:path";
import mammoth from "mammoth";
import WordExtractor from "word-extractor";
import * as cheerio from "cheerio";
import { ApiError } from "./envelope.js";

export async function extractDocumentText(buffer: Buffer, originalname: string): Promise<string> {
  const ext = path.extname(originalname).toLowerCase();

  try {
    if (ext === ".docx") {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value.trim();
      if (!text) throw new Error("Document contains no readable text.");
      return text;
    }

    if (ext === ".doc") {
      const extractor = new WordExtractor();
      const extracted = await extractor.extract(buffer);
      const text = extracted.getBody().trim();
      if (!text) throw new Error("Binary Word document contains no readable text.");
      return text;
    }

    if (ext === ".pdf") {
      const pdfModule: any = await import("pdf-parse");
      if (pdfModule.PDFParse) {
        const parser = new pdfModule.PDFParse({ data: buffer });
        await parser.load();
        const text = (await parser.getText()).trim();
        if (!text) throw new Error("PDF document contains no readable text.");
        return text;
      }
      const parseFn = pdfModule.default || pdfModule;
      const data = await parseFn(buffer);
      return data.text.trim();
    }

    if (ext === ".html" || ext === ".htm") {
      const html = buffer.toString("utf-8");
      const $ = cheerio.load(html);
      $("script, style").remove();
      const text = $("body").text().replace(/\s+/g, " ").trim();
      if (!text) throw new Error("HTML document contains no readable body text.");
      return text;
    }

    throw new ApiError(
      400,
      "UNSUPPORTED_FORMAT",
      `Unsupported file format '${ext}'. Accepted formats are .docx, .doc, .pdf, and .html.`
    );
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      422,
      "EXTRACTION_FAILED",
      `Failed to extract text from '${originalname}': ${err.message}`
    );
  }
}
