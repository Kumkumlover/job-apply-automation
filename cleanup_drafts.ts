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

    const uidsToDelete = [];
    const validKept = [];

    // Group by unique Subject + TO combination
    const grouped = new Map();
    for (const msg of messages) {
      const sub = msg.envelope?.subject;
      const to = msg.envelope?.to?.map(t => t.address).join(',');
      const key = `${sub} | TO: ${to}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(msg);
    }

    for (const [key, msgs] of grouped.entries()) {
      // If it contains an error address, delete all of them
      if (key.includes('error-lite@') || key.includes('undefined')) {
        for (const msg of msgs) {
          uidsToDelete.push(msg.uid);
        }
        continue;
      }

      // Sort by date descending (newest first)
      msgs.sort((a: any, b: any) => b.envelope.date.getTime() - a.envelope.date.getTime());
      
      // Keep the newest one
      const goldenMsg = msgs[0];
      validKept.push({ key, date: goldenMsg.envelope.date });
      
      // Mark all others for deletion
      for (let i = 1; i < msgs.length; i++) {
        uidsToDelete.push(msgs[i].uid);
      }
    }

    console.log(`\nKeeping exactly ONE draft per verified recipient (Total: ${validKept.length}):`);
    for (const k of validKept) {
      console.log(`  - KEEPING: ${k.key}`);
    }

    console.log(`\nFound ${uidsToDelete.length} duplicate/failed drafts to DELETE.`);
    
    if (uidsToDelete.length > 0) {
      const uidString = uidsToDelete.join(',');
      console.log(`Deleting UIDs...`);
      await client.messageFlagsAdd(uidString, ['\\Deleted'], { uid: true });
      await client.mailboxClose(); // Closes and purges
      console.log("Cleanup complete!");
    } else {
      console.log("No duplicates found to delete.");
    }

  } finally {
    if (lock) lock.release();
    await client.logout();
  }
}

run().catch(console.error);
