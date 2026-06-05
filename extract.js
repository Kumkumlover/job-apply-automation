const fs = require("fs");

const log_file = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\f7c2a5f2-3e51-427b-9e30-21910d0721c6\\.system_generated\\logs\\transcript.jsonl";
const output_file = "extracted.txt";

const lines = fs.readFileSync(log_file, "utf-8").split("\n");
const out = fs.createWriteStream(output_file);

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    if (data.type === "VIEW_FILE" || data.type === "CODE_ACTION") {
      const content = data.content || "";
      if (content.includes("search.ts")) {
        out.write(`--- STEP ${data.step_index} ---\n`);
        out.write(content + "\n\n");
      }
    }
  } catch (e) {}
}
out.end();
