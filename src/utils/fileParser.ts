import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Note: In production, this should be handled server-side
});

export interface ParsedDocument {
  documentName: string;
  timestamp?: string; // ISO datetime string (YYYY-MM-DDTHH:mm:ss)
  documentType: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface FileParseResult {
  success: boolean;
  data?: ParsedDocument;
  error?: string;
}

/**
 * Parse file contents using OpenAI GPT to extract document information
 */
export async function parseFileWithGPT(
  file: File,
  fileContent: string
): Promise<FileParseResult> {
  try {
    // Check if OpenAI API key is available
    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      return {
        success: false,
        error: 'OpenAI API key not configured. Please add NEXT_PUBLIC_OPENAI_API_KEY to your environment variables.',
      };
    }

    // Prepare the prompt for GPT
    const prompt = `
You are a travel document parser. Analyze the following file content and extract key information.

File name: ${file.name}
File type: ${file.type}
File size: ${file.size} bytes

File content:
${fileContent}

Please extract the following information from the document content ONLY and return it as JSON:
1. documentName: A clear, descriptive name for the document (e.g., "Passport of John Doe", "VISA for Singapore of Jane Smith", "Flight Ticket to Tokyo", "Hotel Booking in Paris")
2. timestamp: ONLY relevant dates/times explicitly mentioned in the document content (e.g., check-in date, flight departure time, visa expiry date) in ISO datetime format (YYYY-MM-DDTHH:mm:ss). DO NOT use any file metadata or creation dates.
3. documentType: The type of document (e.g., "Passport", "Visa", "Flight Ticket", "Hotel Booking", "Travel Insurance", "Other")
4. confidence: Your confidence level in the parsing (high/medium/low)

Rules:
- ONLY extract dates/times that are explicitly mentioned in the document content (NOT file metadata)
- For hotel bookings: ONLY extract check-in and check-out dates/times mentioned in the document
- For flight tickets: ONLY extract departure/arrival dates/times mentioned in the document
- For visas: ONLY extract visa issue date, expiry date, or travel dates mentioned in the document
- For passports: ONLY extract issue date or expiry date mentioned in the document
- If no relevant dates are found in the document content, omit the timestamp field completely
- Use descriptive names that include the person's name if available
- For flight tickets, include destination in the name
- For visas, include the country and person's name
- For hotel bookings, include the city/location
- Be specific but concise
- For timestamps, include both date and time when available (e.g., "2024-12-25T14:30:00")
- IGNORE any file creation dates, modification dates, or other metadata - only use dates explicitly stated in the document content
`;

    // Call OpenAI API with structured output
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using GPT-4o-mini for better performance/cost ratio
             messages: [
         {
           role: 'system',
           content: 'You are a travel document parser that extracts ONLY information explicitly stated in the document content. NEVER use file metadata, creation dates, or modification dates. Only extract dates/times that are clearly mentioned in the document text itself.',
         },
         {
           role: 'user',
           content: prompt,
         },
       ],
      temperature: 0.1, // Low temperature for consistent parsing
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      return {
        success: false,
        error: 'No response received from OpenAI',
      };
    }

    // Parse the JSON response (should be valid JSON now with structured output)
    try {
      console.log('OpenAI response:', response);
      const parsedData = JSON.parse(response) as ParsedDocument;
      
      // Validate the parsed data
      if (!parsedData.documentName || !parsedData.documentType || !parsedData.confidence) {
        return {
          success: false,
          error: 'Invalid response format from OpenAI - missing required fields',
        };
      }

      // Validate confidence value
      if (!['high', 'medium', 'low'].includes(parsedData.confidence)) {
        return {
          success: false,
          error: 'Invalid confidence value from OpenAI',
        };
      }

      return {
        success: true,
        data: parsedData,
      };
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return {
        success: false,
        error: 'Failed to parse OpenAI response',
      };
    }
  } catch (error) {
    console.error('Error parsing file with GPT:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Read file content as text with truncation for large files
 */
export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target?.result as string;
      
      // Truncate content if it's too long (approximately 50,000 characters to stay well within token limits)
      const maxLength = 50000;
      if (content.length > maxLength) {
        console.warn(`File content truncated from ${content.length} to ${maxLength} characters`);
        resolve(content.substring(0, maxLength) + '\n\n[Content truncated due to length]');
      } else {
        resolve(content);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Check if file type is supported for parsing
 */
export function isFileTypeSupported(file: File): boolean {
  const supportedTypes = [
    'text/plain',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv',
    'application/json',
  ];
  
  return supportedTypes.includes(file.type);
}

/**
 * Main function to parse a file and extract document information
 */
export async function parseDocument(file: File): Promise<FileParseResult> {
  try {
    // Check if file type is supported
    if (!isFileTypeSupported(file)) {
      return {
        success: false,
        error: `File type ${file.type} is not supported for parsing. Supported types: text, PDF, Word documents, CSV, JSON`,
      };
    }

    // Check file size (limit to 10MB for parsing to avoid token limits)
    const maxSizeForParsing = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeForParsing) {
      return {
        success: false,
        error: `File is too large for AI parsing (${Math.round(file.size / (1024 * 1024))}MB). Maximum size for parsing is 10MB.`,
      };
    }

    // Read file content
    const fileContent = await readFileAsText(file);
    
    // Parse with GPT
    const result = await parseFileWithGPT(file, fileContent);
    
    return result;
  } catch (error) {
    console.error('Error in parseDocument:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse document',
    };
  }
}
