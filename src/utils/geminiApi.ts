import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI with your API key
// Note: In a production environment, this should be stored in environment variables
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Standardizes date values using Google's Gemini API
 * @param dateValues An array of date values that need standardization
 * @returns An array of standardized date strings in the format 'YYYY-MM-DD'
 */
export async function standardizeDatesWithGemini(dateValues: Array<string | number | Date>): Promise<string[]> {
  try {
    // Skip processing if API key is not set
    if (!API_KEY) {
      console.error("Gemini API key not set. Please set NEXT_PUBLIC_GEMINI_API_KEY environment variable.");
      return dateValues.map(value => String(value));
    }

    // Convert all values to strings for the API request
    const dateStrings = dateValues.map(date => 
      date instanceof Date ? date.toISOString() : String(date)
    );

    // Format the prompt
    const prompt = `
    I have a set of date values that I need standardized in the ISO format (YYYY-MM-DD).
    Please convert each of these date values and return only the standardized dates, one per line. 
    If a value is not recognizable as a date, return "invalid".
    
    Date values:
    ${dateStrings.join("\n")}
    `;    // Call Gemini API with the latest model name
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();

    // Parse the response into an array of standardized dates
    const standardizedDates = text.split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);

    return standardizedDates;
  } catch (error) {
    console.error("Error standardizing dates with Gemini:", error);
    // Return original values as strings if API call fails
    return dateValues.map(value => String(value));
  }
}
