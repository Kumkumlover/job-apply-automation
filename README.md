# Cold Outreach Apply Automation System 

An autonomous, AI-powered system designed to completely automate the grueling process of finding hiring managers and generating hyper-personalized cold outreach emails. Built to seamlessly integrate with your existing Job Tracker CRM, this suite gives you an unfair advantage in the job market.

We reduce a 20-minute manual research and writing task down to **under 1 minute**, completely autonomously.

---

## 🌊 How It Works: The Application Pipeline

Applying to jobs traditionally is a numbers game with low conversion rates. This system flips the script by automating the highest-ROI activities that most candidates skip. 

Here is the exact step-by-step flow of the pipeline, the APIs powering it, and the massive problems we solved at each step.

### Step 1: Triggering the Pipeline (1-Click Apply vs Manual Frontend)
The journey begins when the user decides to apply for a role. You have two options to start the flow:
- **Flow A (Automated): 1-Click Extension**: The user clicks the **"🚀 Quick Apply"** button in their Job Tracker Chrome Extension while browsing any job board (LinkedIn, Naukri, Wellfound). The system instantly captures the Company Name, Target Role, and the full Job Description (JD) and sends it to the backend Inngest pipeline.
- **Flow B (Manual): Visual Web UI**: The user navigates to the frontend web app (`http://localhost:3000/outreach`), manually enters the Target Company and Target Role, and clicks "Find Contacts" to execute the pipeline step-by-step with full visual review at each stage.
- **APIs Used**: Chrome Extension API (Manifest V3), Next.js API Routes.
- **The Problem We Solved**: Copy-pasting JDs and manual data entry is tedious. The extension parses the DOM and dispatches the payload directly to the background pipeline in one click.

### Step 2: Unconventional Contact Discovery
The hardest part of cold outreach is finding the *actual* hiring manager.
- **The Flow**: The system searches for 3-5 real employees in the relevant department (e.g., Product, Engineering) at the target company.
- **APIs Used**: Serper API (Google Search), Yahoo Search X-Ray (Web Scraping), GitHub API (OSINT).
- **The Problem We Solved**: Standard LinkedIn scraping is dead—blocked by aggressive Cloudflare bot protections, CAPTCHAs, and 429 rate limits. Furthermore, traditional B2B databases (Apollo, ZoomInfo) often have outdated or missing data for small 10-50 person startups. Our engine uses the Serper API to programmatically Google Dork LinkedIn, paired with unconventional OSINT strategies (Yahoo X-Ray, GitHub) to safely bypass these protections and find the right people with 100% reliability.

### Step 3: Cost-Efficient Email Pattern Engine
Once we have the names, we need verified email addresses.
- **The Flow**: The system resolves the discovered names to verified B2B email addresses.
- **APIs Used**: Apollo.io API, Hunter.io API.
- **The Problem We Solved**: Data enrichment APIs are incredibly expensive if used to verify every single contact. Our **Email Discovery Pattern Engine** solves this by spending credits to find just **2 verified emails** for a specific company. From those two, it deduces the company's internal email format pattern (e.g., `first.last@company.com`). It then locally guesses and validates the emails for the rest of the target contacts, saving hundreds of API credits while yielding highly verified contact lists.

### Step 4: Context Retrieval & The RAG Vault
To write a good email, the AI needs to know *why* you are qualified.
- **The Flow**: The system queries your personal "Vault" to retrieve your past achievements and resume details that are most relevant to the JD.
- **APIs Used**: Pinecone (Vector Database), Supabase (PostgreSQL).
- **The Problem We Solved**: Generic "ChatGPT wrappers" write generic emails. By using Retrieval-Augmented Generation (RAG), the system cross-references the specific JD against your stored achievements. If the JD asks for Finance or Marketing, it dynamically pulls your specific finance/marketing background to ground the AI's knowledge.

### Step 5: Hyper-Personalized AI Email Drafting
- **The Flow**: The AI acts as an expert copywriter, taking the contacts, the JD, and your RAG Context, and generates a tailored cold outreach email.
- **APIs Used**: Google Gemini API.
- **The Problem We Solved**: "Dear Hiring Manager" spam. Because the AI is grounded in your specific Vault evidence, it writes emails that incorporate exact keywords and prove your qualifications contextually. It sounds human, highly researched, and specific to the company.

### Step 6: Seamless Gmail Integration
- **The Flow**: The user reviews the AI-generated Master Template in the web UI. Once approved, the system generates the individual drafts for each contact and pushes them directly to the user's Gmail account.
- **APIs Used**: Google OAuth2, Gmail API.
- **The Problem We Solved**: Formatting destruction. Copy-pasting AI output into an email client often breaks bullet points, margins, and hyperlinks. By integrating directly with the Gmail API, we inject the drafts straight into your Gmail "Drafts" folder with rich HTML formatting perfectly preserved.

### Step 7: Orchestration & Reliability
- **The Flow**: The entire 6-step flow above is orchestrated as a durable, asynchronous background job.
- **APIs Used**: Inngest.
- **The Problem We Solved**: Vercel 504 Gateway Timeouts. Serverless Edge Functions time out after 10-15 seconds. Web scraping and LLM generation take much longer. By migrating the pipeline to Inngest, we guarantee absolute reliability, automatic retries, and step-by-step execution without ever dropping a process.

---

## 🛠️ Skills & Technologies Used

- **Framework**: Next.js 14 (App Router), React, TypeScript
- **Backend/Automation**: Inngest (Background Jobs & Pipelines)
- **Database**: Supabase (PostgreSQL), Prisma ORM
- **AI & ML**: Google Gemini API, Pinecone (Vector Database for RAG)
- **Discovery OSINT**: Serper API (Google Dorking), Yahoo Search Scraping, GitHub API, Apollo.io, Hunter.io
- **Auth & Integration**: Google OAuth2, Gmail API (Draft creation)
- **Chrome Extension API**: Manifest V3, content scripts, background service workers

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase Account & Pinecone Account
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
