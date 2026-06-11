# Job Apply Automation System 

An autonomous, AI-powered system designed to automate the process of finding hiring managers and generating hyper-personalized cold outreach emails. Built to seamlessly integrate with your existing Job Tracker CRM and Chrome Extension.

##  Key Features

### 1. Inngest-Powered Automation Pipeline
- A robust, background-job pipeline powered by Inngest. It orchestrates the entire job application process asynchronously: discovering contacts, extracting emails, checking vaults, and writing tailored drafts.
- Ensures absolute reliability; no more serverless timeouts (504 Gateway Timeouts) on Vercel.

### 2. Unconventional Contact Discovery Engine
- Uses advanced open-source intelligence (OSINT) gathering to find employees at startups.
- **Yahoo Search, Serper LinkedIn X-Ray**: Safely performs deep searches for specific departments (e.g. "Product") at target companies to bypass LinkedIn bot protections.
- **GitHub API OSINT**: Searches GitHub for developers associated with the startup domain.
- Seamlessly deduplicates and outputs reliable contact data for the outreach system.

### 3. Contact Enrichment & Email Verification
- Integrates with Apollo.io and Hunter.io via their official APIs.
- Reliably resolves names to verified B2B email addresses.

### 4. Hyper-Personalized AI Drafting
- Leverages Gemini to act as an expert cold-email copywriter.
- Uses a **RAG Vault System** (Pinecone + Supabase) to retrieve your past achievements and specific resume details (e.g. finance or marketing background) to dynamically write the email body.
- No generic templates — every email is specifically tailored to the Job Description (JD).

### 5. Job Tracker Chrome Extension Integration (Quick Apply)
- Integrated directly with the Job Tracker Chrome Extension.
- Browse any job board (LinkedIn, Naukri, Wellfound) and click **"🚀 Quick Apply"**.
- The extension automatically parses the company, role, and JD, and dispatches a payload directly to the automation pipeline.
- 1-click apply -> full pipeline execution.

### 6. Seamless Gmail Integration
- Secure OAuth2 flow to connect your Gmail account.
- Master Template system lets you review and approve AI-generated drafts.
- Pushes finalized emails directly to your Gmail "Drafts" folder with rich HTML formatting preserved.

## 🛠️ Skills & Technologies Used

- **Framework**: Next.js 14 (App Router), React, TypeScript
- **Backend/Automation**: Inngest (Background Jobs & Pipelines)
- **Database**: Supabase (PostgreSQL), Prisma ORM
- **AI & ML**: Google Gemini API, Pinecone (Vector Database for RAG)
- **Discovery**: Yahoo Search Scraping, GitHub API, Apollo.io, Hunter.io
- **Auth & Integration**: Google OAuth2, Gmail API (Draft creation)
- **Chrome Extension API**: Manifest V3, content scripts, background service workers

## 📈 Outcomes
- **Speed**: Reduces the time to research a company, find the hiring manager, and write a personalized email from ~20 minutes to under **1 minute**.
- **Reliability**: With Inngest replacing synchronous edge functions, Vercel timeouts are completely eliminated.
- **Accuracy**: Bypasses traditional Cloudflare bot protections to discover contacts effectively, even at small 10-person
  startups.
## API integrations:
1. Groq LLM
2. Gemini LLM
3. Serper (Search)
4. Hunter/Apollo (Email enrichment)

## Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase Account
- Pinecone Account
- Apollo / Hunter API Keys
- Google Cloud Console Project (with Gmail API enabled)
- Inngest Account
- Serper account
### Installation
```bash
# Clone the repository
git clone https://github.com/Kumkumlover/job-apply-automation.git

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Fill in your Supabase, Gemini, Inngest, and API keys.

# Run the development server and Inngest dev server
npm run dev
npx inngest-cli@latest dev
```
