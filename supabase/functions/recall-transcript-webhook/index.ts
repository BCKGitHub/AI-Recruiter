import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TranscriptMessage {
  role: "interviewer" | "candidate";
  content: string;
  timestamp: string;
}

interface RecallWord {
  text: string;
  start_timestamp?: { relative?: number };
  end_timestamp?: { relative?: number } | null;
}

interface RecallParticipant {
  id?: number;
  name?: string | null;
  is_host?: boolean;
}

// transcript.data event shape (Recall.ai API v1 current)
interface RecallTranscriptDataEvent {
  event?: string;
  data?: {
    data?: {
      words?: RecallWord[];
      language_code?: string;
      participant?: RecallParticipant;
    };
    bot?: { id?: string };
  };
}

function extractSpeakerAndText(body: RecallTranscriptDataEvent): { speaker: string; text: string } | null {
  const innerData = body.data?.data;
  if (!innerData) return null;

  const words = innerData.words ?? [];
  const text = words.map((w) => w.text).join(" ").trim();
  if (!text) return null;

  const participant = innerData.participant;
  const speaker = participant?.name ?? (participant?.is_host ? "host" : String(participant?.id ?? ""));

  return { speaker, text };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // ─── POST /recall-transcript-webhook/call-end ───────────────────────────────
  if (req.method === "POST" && path.endsWith("/call-end")) {
    try {
      const body = await req.json();
      console.log("call-end webhook received:", JSON.stringify(body));

      const botId: string | undefined =
        body.bot_id ?? body.data?.bot?.id ?? body.data?.bot_id;

      if (!botId) {
        return new Response(
          JSON.stringify({ error: "bot_id missing from payload" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: interview, error: fetchError } = await supabase
        .from("interviews")
        .select("id")
        .eq("recall_bot_id", botId)
        .maybeSingle();

      if (fetchError || !interview) {
        console.error("Interview not found for botId:", botId);
        return new Response(
          JSON.stringify({ error: "Interview not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const interviewId = interview.id;

      const { error } = await supabase
        .from("interviews")
        .update({ status: "Completed" })
        .eq("id", interviewId);

      if (error) {
        console.error("Failed to mark interview completed:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Auto-trigger assessment generation
      const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
      if (anthropicApiKey) {
        console.log("Auto-generating assessment for interview:", interviewId);
        fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-assessment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ interviewId }),
        }).catch((err) => console.error("Assessment generation failed:", err));
      }

      return new Response(
        JSON.stringify({ success: true, message: "Interview marked as Completed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (err) {
      console.error("call-end error:", err);
      return new Response(
        JSON.stringify({ error: String(err) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // ─── POST /recall-transcript-webhook (transcript chunks) ───────────────────
  if (req.method === "POST") {
    try {
      const interviewId = url.searchParams.get("interviewId");
      if (!interviewId) {
        return new Response(
          JSON.stringify({ error: "interviewId query param required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const body: RecallTranscriptDataEvent = await req.json();
      console.log("transcript chunk received:", JSON.stringify(body));

      const extracted = extractSpeakerAndText(body);
      if (!extracted) {
        return new Response(
          JSON.stringify({ success: true, skipped: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { speaker, text } = extracted;
      const role: TranscriptMessage["role"] =
        speaker === "0" || speaker.toLowerCase().includes("interview") ? "interviewer" : "candidate";

      const newMessage: TranscriptMessage = {
        role,
        content: text,
        timestamp: new Date().toISOString(),
      };

      const { data: interview, error: fetchError } = await supabase
        .from("interviews")
        .select("transcript")
        .eq("id", interviewId)
        .maybeSingle();

      if (fetchError || !interview) {
        return new Response(
          JSON.stringify({ error: "Interview not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const currentTranscript: TranscriptMessage[] =
        (interview.transcript as TranscriptMessage[]) ?? [];
      const updatedTranscript = [...currentTranscript, newMessage];

      const { error: updateError } = await supabase
        .from("interviews")
        .update({ transcript: updatedTranscript })
        .eq("id", interviewId);

      if (updateError) {
        console.error("Failed to update transcript:", updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, role, appended: text }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (err) {
      console.error("transcript webhook error:", err);
      return new Response(
        JSON.stringify({ error: String(err) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: "Method not allowed" }),
    { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
