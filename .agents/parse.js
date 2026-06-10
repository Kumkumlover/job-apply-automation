const fs = require('fs');

const content = fs.readFileSync('../Opening Details.txt', 'utf-8');
const lines = content.split('\n');
const openings = [];
let current = null;

for (const line of lines) {
  const match = line.match(/^\d+\.\s*(.+?),\s*(.+?),\s*https?:\/\//);
  if (match) {
    if (current) {
      current.jd = current.jd.trim();
      openings.push(current);
    }
    current = {
      company: match[1].trim(),
      role: match[2].trim(),
      jd: ''
    };
  } else if (current) {
    current.jd += line + '\n';
  }
}
if (current) {
  current.jd = current.jd.trim();
  openings.push(current);
}

fs.writeFileSync('.agents/openings.json', JSON.stringify(openings, null, 2));
console.log('Saved ' + openings.length + ' openings');
