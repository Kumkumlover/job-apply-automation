/**
 * Email Generator — Template Engine
 *
 * Generates the final email/message copy from a selected research problem.
 * Supports: Cold Email, Startup Pitch, Follow-up, LinkedIn DM.
 */

import type { ResearchProblem, OutputType } from "./types";

export function generateCopy(
  problem: ResearchProblem,
  outputType: OutputType,
  contactName: string,
  companyName: string,
  role: string
): string {
  const name = contactName || "Hiring Manager";

  if (outputType === "Cold Email") {
    return `Hi ${name},

I came across your post about ${companyName}'s search for a ${role}, and I couldn't be more excited! Your vision of building ${problem.companyMission} resonates deeply with me. Given my background in ${problem.matchedStrengths}, I'd love to explore how I can contribute to this journey.

A little bit about myself:

• I am Shikhar Gupta, an AI Product Intern at SuperAGI (AI CRM), currently owning end-to-end discovery and execution for Analytics, Chat, and Project Management modules, built them from 0–1 and replaced tools like Slack and Jira for internal usage saving more than 150k in cost.
• I have led the development of multiple AI-agents including an AI onboarding agent that reduced customer success costs by 60% and a chat-native PM agent that automated task tracking and reduced project management overhead by 40% in SuperAGI.
• I am a Top PM fellow at Nextleap (Top 10%), Ex Product Analyst @Digital Harbor and have vibecoded automations such as Job email outreach using N8N and Job tracker as a browser extension.

Why am I writing to you?

I'm interested in applying for the ${role} role at ${companyName}. I look forward to interviewing with the team. Thank you for considering my application.

For your reference:
• Portfolio: https://shikharpmg.onhercules.app/ (Reachable at +91 7987177269)
• LinkedIn: https://www.linkedin.com/in/shikhar-gupta-505b0b21b/
• CV: https://assets.nextleap.app/user-resume/ShikharCV-a4a6863b-b8f8-4699-9370-db5da8104ad9.pdf

Best,
Shikhar Gupta`;
  }

  if (outputType === "Startup Pitch") {
    const greeting = contactName || "there";
    return `Hi ${greeting},

I've been following ${companyName}'s recent growth and love what you're building! ${problem.speculativePitch}

Given that you are scaling rapidly, I wanted to reach out directly in case you are looking to bring on a strong 0-1 Product Manager.

A little bit about myself:

• I am Shikhar Gupta, an AI Product Intern at SuperAGI (AI CRM), currently owning end-to-end discovery and execution for Analytics, Chat, and Project Management modules, built them from 0–1 and replaced tools like Slack and Jira for internal usage saving more than 150k in cost.
• I have led the development of multiple AI-agents including an AI onboarding agent that reduced customer success costs by 60% and a chat-native PM agent that automated task tracking and reduced project management overhead by 40% in SuperAGI.
• I am a Top PM fellow at Nextleap (Top 10%), Ex Product Analyst @Digital Harbor and have vibecoded automations such as Job email outreach using N8N and Job tracker as a browser extension.

Based on your product, I put together a quick hypothesis:

• Challenge: ${problem.problem}
• Hypothesis: ${problem.hypothesis}

${problem.hook}

If you're open to expanding your product team, I'd love to connect for a brief 10-minute chat.

For your reference:
• Portfolio: https://shikharpmg.onhercules.app/ (Reachable at +91 7987177269)
• LinkedIn: https://www.linkedin.com/in/shikhar-gupta-505b0b21b/
• CV: https://assets.nextleap.app/user-resume/ShikharCV-a4a6863b-b8f8-4699-9370-db5da8104ad9.pdf

Best,
Shikhar Gupta`;
  }

  if (outputType === "Follow-up") {
    const greeting = contactName || "there";
    return `Subject: Following up | APM Application | Hypothesis for ${companyName}'s ${problem.title}

Hi ${greeting},

I'm sending this as a final note to close the loop on my end. I wanted to leave you with a specific product thought regarding ${companyName}'s friction points that I came across while researching your model.

• The Challenge: ${problem.problem}
• The Idea: ${problem.hypothesis}
• The Goal: ${problem.pmGoal}

${problem.hook}

I specialize in 0-1 execution and driving user adoption. If you're open to a 10-minute chat, I'd love to connect.

Best,
Shikhar Gupta`;
  }

  // LinkedIn DM
  const greeting = `Hi ${contactName || "there"},`;
  if (problem.linkedinHook && problem.linkedinHook.trim() !== "") {
    return `${greeting}

${problem.linkedinHook}

I've been analyzing ${companyName}'s product and wanted to share a hypothesis regarding ${problem.title}.

• Challenge: ${problem.problem}
• Hypothesis: ${problem.hypothesis}

${problem.hook}

I'd love to send over the full logic if you're curious. Cheers!`;
  }

  return `${greeting} following ${companyName}'s work and wanted to share a hypothesis regarding ${problem.title}.

• Challenge: ${problem.problem}
• Hypothesis: ${problem.hypothesis}

${problem.hook}

I'd love to send over the full logic if you're curious. Cheers!`;
}
