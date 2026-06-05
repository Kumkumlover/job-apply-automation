const fs = require('fs');
const lines = fs.readFileSync('extracted.txt', 'utf8').split('\n');
const ddgLine = lines.findIndex(l => l.includes('ddgSearch'));
if (ddgLine >= 0) {
  const start = Math.max(0, ddgLine - 100);
  const end = Math.min(lines.length, ddgLine + 400);
  console.log(lines.slice(start, end).join('\n'));
} else {
  console.log("ddgSearch not found in extracted.txt");
}
