import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey!);

async function run() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  try {
    const result = await model.generateContent("Hello!");
    console.log(result.response.text());
  } catch (err: any) {
    console.error("SDK Error:", err.message);
  }
}
run();
