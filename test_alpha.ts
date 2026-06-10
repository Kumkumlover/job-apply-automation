import OpenAI from "openai";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1/openai/",
});

async function run() {
  try {
    const response = await client.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: "Hello!" }],
      temperature: 0.0,
    });
    console.log(response.choices[0]?.message?.content);
  } catch (err: any) {
    console.error(err.status, err.message);
  }
}
run();
