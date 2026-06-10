import { ImapFlow } from 'imapflow';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function run() {
  const credentials = fs.readFileSync('credentials.txt', 'utf-8').split('\n');
  const linkedinEmail = credentials[0].split('Linkedin: ')[1].trim();
  
  const smtpUser = process.env.SMTP_USER || linkedinEmail;
  const smtpPass = process.env.SMTP_PASS || 'vysn aibz pzix oknt';

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user: smtpUser, pass: smtpPass },
    logger: false
  });

  await client.connect();
  const lock = await client.getMailboxLock('[Gmail]/Drafts');
  try {
    const messages = [];
    for await (const msg of client.fetch('1:*', { uid: true, envelope: true })) {
      if (msg.envelope?.subject?.includes('Application:')) {
        messages.push(msg);
      }
    }

    const map = new Map();
    for (const msg of messages) {
      const sub = msg.envelope?.subject;
      const to = msg.envelope?.to?.map(t => t.address).join(',');
      const key = `${sub} | TO: ${to}`;
      if (!map.has(key)) map.set(key, 0);
      map.set(key, map.get(key) + 1);
    }

    console.log("Unique (Subject + To) Combinations:");
    for (const [key, count] of map.entries()) {
      console.log(`- ${key} (Count: ${count})`);
    }

  } finally {
    if (lock) lock.release();
    await client.logout();
  }
}

run().catch(console.error);
