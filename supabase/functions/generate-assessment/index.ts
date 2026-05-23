import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk@0.27.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { interviewId } = await req.json();

    if (!interviewId) {
      return new Response(
        JSON.stringify({ error: "interviewId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: interview, error: fetchError } = await supabase
      .from("interviews")
      .select("*")
      .eq("id", interviewId)
      .maybeSingle();

    if (fetchError || !interview) {
      return new Response(
        JSON.stringify({ error: "Interview not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transcript = interview.transcript as Array<{ role: string; content: string; timestamp?: string }> | null;
    const transcriptText = transcript
      ? transcript.map((m) => `${m.role === "interviewer" ? "Interviewer" : "Candidate"}: ${m.content}`).join("\n\n")
      : "No transcript available.";

    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `You are a senior technical recruiter evaluating a job interview. Analyze the following interview transcript and job description, then produce a structured assessment.

JOB DESCRIPTION:
${interview.job_description}

CANDIDATE: ${interview.candidate_name}

INTERVIEW TRANSCRIPT:
${transcriptText}

Respond ONLY with a valid JSON object (no markdown, no code fences) matching exactly this structure:
{
  "technicalSkillsMatch": <number 1-10>,
  "technicalSkillsRationale": "<brief explanation>",
  "technicalSkillsQuote": "<key quote from transcript>",
  "communicationClarity": <number 1-10>,
  "communicationRationale": "<brief explanation>",
  "communicationQuote": "<key quote from transcript>",
  "depthOfExperience": <number 1-10>,
  "depthRationale": "<brief explanation>",
  "depthQuote": "<key quote from transcript>",
  "cultureFitIndicators": ["<indicator 1>", "<indicator 2>", "<indicator 3>"],
  "overallRecommendation": "<Strong Yes | Yes | Maybe | No>",
  "recommendationSummary": "<2-3 sentence summary explaining the recommendation>"
}`,
        },
      ],
    });

    const rawText = message.content[0].type === "text" ? message.content[0].text : "";
    // Strip markdown code fences if Claude wraps the JSON
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    let assessment: Record<string, unknown>;
    try {
      assessment = JSON.parse(cleaned);
    } catch {
      return new Response(
        JSON.stringify({ error: "Failed to parse Claude response", raw: rawText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: updateError } = await supabase
      .from("interviews")
      .update({ assessment })
      .eq("id", interviewId);

    if (updateError) {
      console.error("Failed to save assessment:", updateError);
    }

    return new Response(
      JSON.stringify({ success: true, assessment }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
