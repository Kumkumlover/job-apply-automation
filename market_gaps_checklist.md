# Market Gaps & Feature Checklist

## Primary Target Users & Core Problems
The primary target users are **job seekers wanting more interviews**. They typically fall into three distinct personas, each facing core problems in the modern job search landscape:

1. **The Volume Applicant:** 
   - *Core Problem:* Spending countless hours manually filling out repetitive ATS forms.
   - *Need:* High-speed mass applications and automated data entry.
2. **The Precision Sniper / Networker:** 
   - *Core Problem:* Low response rates from generic applications, needing a way to stand out to hiring managers directly.
   - *Need:* Deep research, targeted multi-step outreach, and omni-channel networking (email + LinkedIn).
3. **The ATS Optimizer / Career Switcher:** 
   - *Core Problem:* Resumes getting automatically rejected by Applicant Tracking Systems (ATS) because they lack specific keywords.
   - *Need:* Dynamic tailoring of resumes and cover letters for each specific job description.

## Key Competitors Analyzed
- **getmoreinterviews.ai:** Focuses on automated cold outreach and multi-step drip email sequences.
- **LazyApply / LoopCV:** Solves the volume problem via mass auto-applying using browser extensions or backend bots.
- **Simplify Copilot:** Focuses on auto-filling ATS forms seamlessly and providing a centralized tracking dashboard.
- **TealHQ / AIApply:** Focuses on career tracking and AI-customized resumes to beat the ATS.

## Actionable Checklist of Feature Gaps & Integrations
Based on the flow analysis of the current JobSuite (which currently only handles single-shot top-of-funnel email drafting) and the market research above, the following features and integrations must be built:

- [ ] **Gap 1: Automated Follow-ups & Multi-Step Drip Campaigns (POST-MVP)**
  - *User Feedback:* "We need to build this, but after we have realeased the initial MVP."
  - *Current State:* Single-shot email drafts via IMAP.
  - *Solution & Integration:* Integrate `Inngest` or `BullMQ` combined with `Mailgun` / `SendGrid` to schedule automated day-3/day-7 follow-up sequences and track open/reply rates.

- [ ] **Gap 2: Web-to-Pipeline Sourcing & Auto-Fill (Browser Extension) (MVP PRIORITY)**
  - *User Feedback:* "One thing we can use is, the browser extension we have in our Job tracker, since it already scrapes job pages. When the user is in a job page, they have the browser open, we already have the autofill buttton there. We have just add the quick apply button there, and the scarper will parse the JD from the page, rest of the details Via autofill button, and trigger and quick apply sequence from there and sent the emails."
  - *Solution & Integration:* Add a "Quick Apply" button to the existing Job Tracker browser extension. Make it send the parsed JD and autofill data to the `job-apply-automation` backend to instantly trigger the outreach sequence.

- [x] **Gap 3: Dynamic Resume Context Tailoring (NOT A PRIORITY)**
  - *User Feedback:* "Not a priority"

- [x] **Gap 4: Omni-Channel Outreach (LinkedIn) (NOT A PRIORITY)**
  - *User Feedback:* "Not a priority"

- [x] **Gap 5: Centralized Application Tracking System (CRM) (ALREADY EXISTS)**
  - *User Feedback:* "what are you even saying? isnt our Job tracker specifically built for this?"
  - *Correction:* The `Job tracker` software suite already handles the CRM and application stages perfectly. No new CRM backend needs to be built in the automation tool; we just need them to talk to each other.
