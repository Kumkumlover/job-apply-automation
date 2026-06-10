import fs from 'fs';

function parseOpenings(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split('\n');
  const openings = [];
  let currentOpening = null;
  let jdLines = [];

  for (const line of lines) {
    const match = line.match(/^\d+\.\s*(.+?),\s*(.+?),\s*(https?:\/\/.+)/);
    if (match) {
      if (currentOpening) {
        currentOpening.jd = jdLines.join('\n').trim();
        openings.push(currentOpening);
      }
      currentOpening = {
        company: match[1].trim(),
        role: match[2].trim(),
        url: match[3].trim(),
        jd: ""
      };
      jdLines = [];
    } else if (currentOpening) {
      jdLines.push(line);
    }
  }
  if (currentOpening) {
    currentOpening.jd = jdLines.join('\n').trim();
    openings.push(currentOpening);
  }
  return openings;
}

const openings = parseOpenings('../Opening Details.txt');
fs.writeFileSync('jobs.json', JSON.stringify(openings, null, 2));
console.log(`Saved ${openings.length} jobs to jobs.json`);
