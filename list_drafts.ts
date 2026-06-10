import { ImapFlow } from 'imapflow';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function run() {
  const credentials = fs.readFileSync('credentials.txt', 'utf-8').split('\n');
  const linkedinEmail = credentials[0].split('Linkedin: ')[1].trim();
  
  const smtpUser = process.env.SMTP_USER || linkedinEmail;
  const smtpPass = process.env.SMTP_PASS || 'vysn aibz pzix oknt';

  console.log(`Connecting to IMAP for user: ${smtpUser}`);

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

    console.log(`Found ${messages.length} Application drafts.`);
    
    // Group by subject to show counts
    const counts = new Map();
    for (const msg of messages) {
      const sub = msg.envelope?.subject;
      if (!counts.has(sub)) counts.set(sub, []);
      counts.get(sub).push(msg.envelope?.date);
    }
    
    for (const [sub, dates] of counts.entries()) {
      console.log(`\nSubject: ${sub} (Total: ${dates.length})`);
      for (const d of dates) {
         console.log(`  - Date: ${d.toISOString()}`);
      }
    }

  } finally {
    if (lock) lock.release();
    await client.logout();
  }
}

run().catch(console.error);
