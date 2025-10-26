import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

export const ParsedDocument = z.object({
  genericName: z.string().describe("Short descriptive name, e.g. 'Flight ticket to Delhi' or 'Hotel booking at Taj Palace'"),

  documentType: z.enum([
    "flight_ticket",
    "train_ticket",
    "bus_ticket",
    "hotel_booking",
    "entry_ticket",
    "visa",
    "passport",
    "itinerary",
    "other",
  ]).describe("Type of travel document inferred from content"),

  origin: z.string().nullable().describe("Starting location, if relevant (e.g. Bangalore)"),
  destination: z.string().nullable().describe("Destination location, if relevant (e.g. Chennai)"),

  placeName: z.string().nullable().describe("Name of place or attraction (e.g. 'Ajmer Fort', 'Eiffel Tower')"),

  startDate: z.string().nullable().describe("Start or departure date (YYYY-MM-DD if present)"),
  endDate: z.string().nullable().describe("End or return date (YYYY-MM-DD if present)"),

  travelerNames: z.array(z.string()).nullable().describe("Names of travelers if listed in the document"),
  bookingId: z.string().nullable().describe("Unique booking or reservation identifier (e.g., PNR for tickets, booking ID for hotels, reference code for entry passes)."),
});

const FileParseResult = z.object({
  success: z.boolean(),
  data: ParsedDocument.nullable(), // required, but can be null
  error: z.string().nullable(), // required, but can be null
});

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Safe here since you’re local-only
});

/**
 * Parse file contents using OpenAI GPT to extract document information
 */
export async function parseFileWithGPT(file: File): Promise<FileParseResult> {
  try {
    if (!isFileTypeSupported(file)) {
      return {
        success: false,
        error: `File type ${file.type} is not supported. Supported: PDF, Word, TXT, CSV, JSON`,
      };
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: `File too large (${Math.round(file.size / (1024 * 1024))}MB). Max is 10MB.`,
      };
    }

    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      return {
        success: false,
        error:
          "OpenAI API key not configured. Please add NEXT_PUBLIC_OPENAI_API_KEY to your env.",
      };
    }

    const base64Image = await fileToBase64(file);

    const res = await openai.responses.parse({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: "You are an AI that extracts structured information from travel booking confirmations or tickets.",
        },
        {
          role: "user",
          content: [
            { type: "input_text", text: "Extract structured information from this travel document image." },
            {
              type: "input_image",
              detail: "auto",
              image_url: `data:${file.type};base64,${base64Image}`,
            },
          ],
        },
      ],
      text: {
        format: zodTextFormat(FileParseResult, "file_parse_result"),
      }
    });
    const parsed = res.output_parsed;
    console.log({ parsed });

    if (!parsed) {
      return { success: false, error: "No structured output returned from model." };
    }

    return parsed;
  } catch (err: any) {
    console.error("parseFileWithGPT error:", err);
    return { success: false, error: err?.message || "Unknown error occurred" };
  }
}

/**
 * Check if file type is supported for parsing
 */
export function isFileTypeSupported(file: File): boolean {
  const supportedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  return supportedTypes.includes(file.type);
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Main function to parse a file and extract document information
 */
export async function parseDocument(file: File): Promise<typeof FileParseResult> {
  try {
    return await parseFileWithGPT(file);
  } catch (error: any) {
    console.error("parseDocument error:", error);
    return { success: false, error: error?.message || "Failed to parse document" };
  }
}
