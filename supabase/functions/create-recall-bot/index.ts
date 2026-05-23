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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const appUrl = Deno.env.get("APP_URL") || Deno.env.get("VITE_APP_URL") || supabaseUrl;

    // Agent page is a static HTML file served by the frontend — guaranteed text/html
    const agentUrl = `${appUrl}/agent.html?interviewId=${encodeURIComponent(interviewId)}`;

    console.log("Creating Recall bot with agent URL:", agentUrl);

    const recallResponse = await fetch("https://us-west-2.recall.ai/api/v1/bot", {
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
        variant: {
          zoom: "web_4_core",
          google_meet: "web_4_core",
          microsoft_teams: "web_4_core",
        },
        recording_config: {
          transcript: {
            provider: {
              assembly_ai_v3_streaming: {},
            },
            diarization: {
              use_separate_streams_when_available: true,
            },
          },
          include_bot_in_recording: {
            audio: true,
          },
        },
      }),
    });

    const recallData = await recallResponse.json();

    if (!recallResponse.ok) {
      console.error("Recall.ai error:", recallData);
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

    await supabase
      .from("interviews")
      .update({ recall_bot_id: recallData.id, status: "In Progress" })
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
