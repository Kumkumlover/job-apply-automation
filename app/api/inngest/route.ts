import { serve } from "inngest/next";
import { inngest, applyPipeline } from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [applyPipeline],
});
