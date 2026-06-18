import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

  // ── GET /create-recall-bot?botId=xxx  ──  proxy Recall.ai bot status ─────────
  if (req.method === "GET") {
    const url = new URL(req.url);
    const botId = url.searchParams.get("botId");
    if (!botId) {
      return new Response(
        JSON.stringify({ error: "botId query param required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const recallApiKey = Deno.env.get("RECALL_API_KEY");
    if (!recallApiKey) {
      return new Response(
        JSON.stringify({ error: "RECALL_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const res = await fetch(`https://us-west-2.recall.ai/api/v1/bot/${botId}/`, {
      headers: { "Authorization": `Token ${recallApiKey}` },
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── POST /create-recall-bot  ──  create a new bot ────────────────────────────
  try {
    const { interviewId, zoomUrl } = await req.json();

    if (!interviewId || !zoomUrl) {
      return new Response(
        JSON.stringify({ error: "interviewId and zoomUrl are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const recallApiKey = Deno.env.get("RECALL_API_KEY");
    if (!recallApiKey) {
      return new Response(
        JSON.stringify({ error: "RECALL_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use /agent.html explicitly so Netlify serves the static file directly,
    // bypassing the /* → /index.html SPA redirect in _redirects.
    const origin = req.headers.get("origin");
    let agentUrl: string;
    if (origin && origin !== "null") {
      agentUrl = `${origin}/agent.html?interviewId=${encodeURIComponent(interviewId)}`;
    } else {
      agentUrl = `${supabaseUrl}/functions/v1/agent-page?interviewId=${encodeURIComponent(interviewId)}`;
    }

    console.log("Creating Recall bot with agent URL:", agentUrl);

    const recallResponse = await fetch("https://us-west-2.recall.ai/api/v1/bot/", {
      method: "POST",
      headers: {
        "Authorization": `Token ${recallApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        meeting_url: zoomUrl,
        bot_name: "AI Interviewer",
        output_media: {
          camera: {
            kind: "webpage",
            config: {
              url: agentUrl,
            },
          },
        },
      }),
    });

    const recallData = await recallResponse.json();

    if (!recallResponse.ok) {
      console.error("Recall.ai error:", JSON.stringify(recallData));
      return new Response(
        JSON.stringify({
          error: `Recall.ai rejected the request (HTTP ${recallResponse.status}): ${JSON.stringify(recallData)}`,
        }),
        { status: recallResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Keep status as "Scheduled" — it will advance to "In Progress" only
    // once the bot confirms it is actually in the call (via frontend polling).
    await supabase
      .from("interviews")
      .update({ recall_bot_id: recallData.id })
      .eq("id", interviewId);

    return new Response(
      JSON.stringify({ success: true, botId: recallData.id, agentUrl, bot: recallData }),
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
