# Job Apply Automation System 🚀

An autonomous, AI-powered system designed to completely automate the grueling process of finding hiring managers and generating hyper-personalized cold outreach emails. Built to seamlessly integrate with your existing Job Tracker CRM, this suite gives you an unfair advantage in the job market.

## 🌟 The Value We Deliver

Applying to jobs traditionally is a numbers game with low conversion rates. This system flips the script by automating the highest-ROI activities that most candidates skip because they are too tedious: **finding the exact decision-maker** and **writing a highly researched, personalized pitch**.

We reduce a 20-minute manual research and writing task down to **under 1 minute**, completely autonomously.

---

## 🚀 Core Capabilities & Features

### 1. Cost-Efficient Email Discovery (The Pattern Engine)
Data enrichment APIs are expensive. Our **Email Discovery Pattern Engine** is built to minimize API costs while maximizing accuracy:
- It intelligently uses Apollo.io and Hunter.io APIs sparingly.
- By finding just **2 verified emails** for a specific company, the engine deduces the company's internal email format pattern (e.g., `first.last@company.com` or `f.last@company.com`).
- It then accurately guesses and validates the email addresses for the rest of the target contacts locally, saving hundreds of API credits while yielding highly verified contact lists.

### 2. Hyper-Personalized AI Email Generation (RAG Vault)
This isn't just a generic ChatGPT wrapper. The **Email Gen** system acts as your personal expert copywriter:
- **RAG Vault System**: It stores your achievements, resume details, and portfolio links in a vector database (Pinecone + Supabase).
- **Dynamic Context**: When you apply for a job, it cross-references the specific Job Description (JD) against your stored achievements.
- **Tailored Output**: If the JD asks for Finance or Marketing, the AI dynamically pulls your specific finance/marketing background from the vault. It writes the email incorporating the exact keywords, proving your qualifications contextually rather than sending a generic template.

### 3. Unconventional Contact Discovery Engine
Standard LinkedIn search limits and bot protections (like Cloudflare) stop most scrapers. Our Discovery Engine embraces OSINT strategies to bypass these:
- **Yahoo Search LinkedIn X-Ray**: Safely performs deep searches for specific departments (e.g. "Product" or "Engineering") at target companies without triggering LinkedIn's anti-bot measures.
- **GitHub API OSINT**: Scrapes GitHub for developers associated with the startup domain.
- Seamlessly deduplicates and outputs reliable contacts, specifically optimized for smaller 10-50 person startups where traditional databases fail.

### 4. 1-Click "Quick Apply" Chrome Extension
- Directly integrated with your Job Tracker Chrome Extension.
- Browse any job board (LinkedIn, Naukri, Wellfound) and click **"🚀 Quick Apply"**.
- The extension parses the company, role, and JD, and dispatches it directly to the automation pipeline in the background.

### 5. Inngest-Powered Reliability
- No more 504 Gateway Timeouts. The entire job application process is orchestrated asynchronously via **Inngest**.
- This guarantees absolute reliability, retries, and step-by-step execution across discovering contacts, extracting emails, checking vaults, and writing drafts.

### 6. Seamless Gmail Integration
- Secure OAuth2 flow connects directly to your Gmail account.
- Review and approve the AI-generated drafts using the Master Template system.
- Pushes finalized emails directly to your Gmail "Drafts" folder with rich HTML formatting perfectly preserved.

---

## 🛠️ Skills & Technologies Used

- **Framework**: Next.js 14 (App Router), React, TypeScript
- **Backend/Automation**: Inngest (Background Jobs & Pipelines)
- **Database**: Supabase (PostgreSQL), Prisma ORM
- **AI & ML**: Google Gemini API, Pinecone (Vector Database for RAG)
- **Discovery OSINT**: Yahoo Search Scraping, GitHub API, Apollo.io, Hunter.io
- **Auth & Integration**: Google OAuth2, Gmail API (Draft creation)
- **Chrome Extension API**: Manifest V3, content scripts, background service workers

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase Account & Pinecone Account
- Apollo / Hunter API Keys
- Google Cloud Console Project (with Gmail API enabled)
- Inngest Account

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
