import json

log_file = r"C:\Users\Lenovo\.gemini\antigravity\brain\f7c2a5f2-3e51-427b-9e30-21910d0721c6\.system_generated\logs\transcript.jsonl"
output_file = "extracted.txt"

with open(log_file, "r", encoding="utf-8") as f, open(output_file, "w", encoding="utf-8") as out:
    for line in f:
        try:
            data = json.loads(line.strip())
            if data.get("type") == "VIEW_FILE" or data.get("type") == "CODE_ACTION":
                content = data.get("content", "")
                if "search.ts" in content:
                    out.write(f"--- STEP {data.get('step_index')} ---\n")
                    out.write(content + "\n\n")
        except:
            pass
