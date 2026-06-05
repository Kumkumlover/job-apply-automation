import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { ImapFlow } from "imapflow";
import MailComposer from "nodemailer/lib/mail-composer/index.js";

async function run() {
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
    logger: false,
  });

  try {
    await client.connect();
    console.log("IMAP Connected!");

    const mailOptions = {
      from: `"Shikhar Gupta" <${process.env.SMTP_USER}>`,
      to: "testdraft@salaryse.com",
      subject: "Test Draft Subject",
      html: "<p>Hello this is a drafted email.</p>",
    };

    const mail = new MailComposer(mailOptions);
    const rawEml = await mail.compile().build();

    const appendRes = await client.append("[Gmail]/Drafts", rawEml, ["\\Draft"]);
    console.log("Draft created successfully:", appendRes);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    client.logout();
  }
}

run();
