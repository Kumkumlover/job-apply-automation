import fs from 'fs';
import { ImapFlow } from 'imapflow';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

function parseOpenings(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split('\n');
  const openings: {company: string, role: string, url: string, jd: string}[] = [];
  let currentOpening: {company: string, role: string, url: string, jd: string} | null = null;
  let jdLines: string[] = [];

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

async function run() {
  const credentials = fs.readFileSync('credentials.txt', 'utf-8').split('\n');
  const linkedinEmail = credentials[0].split('Linkedin: ')[1].trim();
  const linkedinPass = credentials[1].split('Password: ')[1].trim();
  
  const smtpUser = process.env.SMTP_USER || linkedinEmail;
  const smtpPass = process.env.SMTP_PASS || 'vysn aibz pzix oknt'; // from original script

  const openings = parseOpenings('../Opening Details.txt');
  const expectedSubjects = openings.map(o => `Application: ${o.role} — ${o.company}`);

  console.log(`Checking for ${expectedSubjects.length} specific subjects in Drafts...`);

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user: smtpUser, pass: smtpPass },
    logger: false
  });
  
  await client.connect();
  const lock = await client.getMailboxLock('[Gmail]/Drafts');
  const foundSubjects = new Set<string>();

  try {
    if (!client.mailbox || typeof client.mailbox === 'boolean' || client.mailbox.exists === 0) {
      console.log('No drafts found.');
    } else {
      for await (const msg of client.fetch('1:*', { uid: true, envelope: true })) {
        const subject = msg.envelope?.subject;
        if (subject && expectedSubjects.includes(subject)) {
          console.log(`Found matching draft: ${subject}`);
          foundSubjects.add(subject);
        }
      }
    }
  } finally {
    lock.release();
  }
  
  await client.logout();

  console.log(`\nFound ${foundSubjects.size} / ${expectedSubjects.length} expected drafts.`);
  const missing = expectedSubjects.filter(s => !foundSubjects.has(s));
  if (missing.length > 0) {
    console.log("Missing drafts for:", missing);
  }
}

run().catch(console.error);
