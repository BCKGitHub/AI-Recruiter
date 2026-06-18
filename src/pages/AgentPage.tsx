import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Interview, TranscriptMessage } from "../lib/database.types";

type AgentStatus =
  | "loading"
  | "ready"
  | "connecting"
  | "listening"
  | "speaking"
  | "error";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

function buildSystemPrompt(interview: Interview): string {
  return `You are an AI technical interviewer conducting a structured job interview. Your goal is to evaluate the candidate thoroughly and fairly.

CANDIDATE: ${interview.candidate_name}
EMAIL: ${interview.candidate_email}

JOB DESCRIPTION:
${interview.job_description}

CANDIDATE RESUME:
${interview.resume}

INTERVIEW INSTRUCTIONS:
- Start by warmly greeting ${interview.candidate_name} and introducing yourself as their AI interviewer
- Conduct a structured 20-30 minute technical interview covering: relevant technical skills, past experience, problem-solving approach, and cultural fit
- Ask one question at a time and wait for the candidate to finish before responding
- Follow up on interesting answers to dig deeper
- Be professional, encouraging, and neutral in tone
- Cover at least 5-7 substantive questions tailored to the job description and their resume
- When the interview is complete, thank the candidate and let them know the team will be in touch
- Do NOT reveal scores, assessments, or internal notes to the candidate
- Keep responses concise and conversational — this is a spoken interview, not a text chat`;
}

export default function AgentPage() {
  const [status, setStatus] = useState<AgentStatus>("loading");
  const [statusText, setStatusText] = useState("Initializing...");
  const [interview, setInterview] = useState<Interview | null>(null);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const transcriptRef = useRef<TranscriptMessage[]>([]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interviewIdRef = useRef<string | null>(null);

  // Keep ref in sync so async handlers always see latest transcript
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Debounced save to Supabase
  function scheduleTranscriptSave(updated: TranscriptMessage[]) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      if (!interviewIdRef.current) return;
      await supabase
        .from("interviews")
        .update({ transcript: updated })
        .eq("id", interviewIdRef.current);
    }, 1500);
  }

  function appendTranscript(role: TranscriptMessage["role"], content: string) {
    const msg: TranscriptMessage = {
      role,
      content,
      timestamp: new Date().toISOString(),
    };
    const updated = [...transcriptRef.current, msg];
    transcriptRef.current = updated;
    setTranscript(updated);
    scheduleTranscriptSave(updated);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const interviewId = params.get("interviewId");
    if (!interviewId) {
      setStatus("error");
      setStatusText("Missing interviewId parameter");
      return;
    }
    interviewIdRef.current = interviewId;

    async function init() {
      try {
        setStatusText("Loading interview data...");

        // 1. Fetch interview from Supabase
        const { data, error } = await supabase
          .from("interviews")
          .select("*")
          .eq("id", interviewId)
          .maybeSingle();

        if (error || !data) {
          throw new Error(error?.message || "Interview not found");
        }
        setInterview(data as Interview);

        // Restore existing transcript if any
        if (data.transcript && Array.isArray(data.transcript)) {
          transcriptRef.current = data.transcript as TranscriptMessage[];
          setTranscript(data.transcript as TranscriptMessage[]);
        }

        setStatus("connecting");
        setStatusText("Connecting to OpenAI Realtime...");

        // 2. Get ephemeral token from our edge function
        const tokenRes = await fetch(
          `${SUPABASE_URL}/functions/v1/openai-realtime-token?model=gpt-4o-realtime-preview&voice=alloy`,
          {
            headers: {
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              Apikey: SUPABASE_ANON_KEY,
            },
          }
        );
        if (!tokenRes.ok) {
          const err = await tokenRes.text();
          throw new Error(`Token fetch failed: ${err}`);
        }
        const tokenData = await tokenRes.json();
        const ephemeralKey: string = tokenData.client_secret?.value;
        if (!ephemeralKey) throw new Error("No ephemeral key in token response");

        // 3. Set up WebRTC peer connection
        const pc = new RTCPeerConnection();
        pcRef.current = pc;

        // Remote audio → play through speaker (bot streams this to meeting)
        const audioEl = document.createElement("audio");
        audioEl.autoplay = true;
        document.body.appendChild(audioEl);
        audioElRef.current = audioEl;
        pc.ontrack = (e) => {
          audioEl.srcObject = e.streams[0];
          setStatus("listening");
          setStatusText(`Listening — ${(data as Interview).candidate_name}`);
        };

        // Local mic → send to OpenAI (Recall.ai auto-grants mic = meeting audio)
        let audioTrack: MediaStreamTrack;
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioTrack = stream.getAudioTracks()[0];
        } catch {
          // Headless browser without mic — use silent track so WebRTC still connects
          const ctx = new AudioContext();
          const dst = ctx.createMediaStreamDestination();
          audioTrack = dst.stream.getAudioTracks()[0];
        }
        pc.addTrack(audioTrack);

        // Data channel for events (transcripts, function calls)
        const dc = pc.createDataChannel("oai-events");
        dcRef.current = dc;

        dc.onopen = () => {
          // Configure session: send system prompt, enable transcription, speak first
          const sessionUpdate = {
            type: "session.update",
            session: {
              modalities: ["text", "audio"],
              instructions: buildSystemPrompt(data as Interview),
              voice: "alloy",
              input_audio_transcription: { model: "whisper-1" },
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 700,
              },
            },
          };
          dc.send(JSON.stringify(sessionUpdate));

          // Trigger the AI to speak first (greeting)
          const responseCreate = {
            type: "response.create",
            response: {
              modalities: ["text", "audio"],
              instructions: `Greet ${(data as Interview).candidate_name} warmly, introduce yourself as their AI interviewer for the ${(data as Interview).candidate_name} role, and ask your first interview question based on their resume and the job description.`,
            },
          };
          dc.send(JSON.stringify(responseCreate));
        };

        dc.onmessage = (e) => {
          try {
            const event = JSON.parse(e.data);
            handleRealtimeEvent(event, data as Interview);
          } catch {
            // ignore parse errors
          }
        };

        // 4. Create SDP offer, wait for ICE gathering, then connect to OpenAI
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Wait for ICE candidates to be fully gathered before sending SDP
        await new Promise<void>((resolve) => {
          if (pc.iceGatheringState === "complete") { resolve(); return; }
          const onState = () => {
            if (pc.iceGatheringState === "complete") {
              pc.removeEventListener("icegatheringstatechange", onState);
              resolve();
            }
          };
          pc.addEventListener("icegatheringstatechange", onState);
          setTimeout(resolve, 4000); // max 4s fallback
        });

        const sdpRes = await fetch(
          `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${ephemeralKey}`,
              "Content-Type": "application/sdp",
            },
            body: pc.localDescription!.sdp,
          }
        );
        if (!sdpRes.ok) {
          const err = await sdpRes.text();
          throw new Error(`SDP negotiation failed: ${err}`);
        }
        const answerSdp = await sdpRes.text();
        await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

        setStatus("listening");
        setStatusText(`Connected — waiting for ${(data as Interview).candidate_name}`);
      } catch (err) {
        console.error("Agent init error:", err);
        setStatus("error");
        setStatusText(String(err));
      }
    }

    init();

    return () => {
      pcRef.current?.close();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  function handleRealtimeEvent(event: Record<string, unknown>, iv: Interview) {
    const type = event.type as string;

    // AI started speaking
    if (type === "output_audio_buffer.started") {
      setStatus("speaking");
      setStatusText("AI Interviewer speaking...");
    }

    // AI finished speaking
    if (type === "output_audio_buffer.stopped" || type === "response.audio.done") {
      setStatus("listening");
      setStatusText(`Listening — ${iv.candidate_name}`);
    }

    // Completed AI text transcript (interviewer turn)
    if (type === "response.audio_transcript.done") {
      const text = (event.transcript as string) ?? "";
      if (text.trim()) appendTranscript("interviewer", text.trim());
    }

    // Completed candidate speech transcript
    if (
      type === "conversation.item.input_audio_transcription.completed"
    ) {
      const text = (event.transcript as string) ?? "";
      if (text.trim()) appendTranscript("candidate", text.trim());
    }
  }

  // Visual status indicator colors
  const statusColor: Record<AgentStatus, string> = {
    loading: "bg-gray-400",
    ready: "bg-blue-500",
    connecting: "bg-yellow-400",
    listening: "bg-green-500",
    speaking: "bg-blue-500",
    error: "bg-red-500",
  };

  const isPulsing = status === "listening" || status === "speaking" || status === "connecting";

  return (
    <div
      style={{
        width: "1280px",
        height: "720px",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "white",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Main card */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "32px",
          padding: "48px 64px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "24px",
          backdropFilter: "blur(12px)",
          minWidth: "520px",
        }}
      >
        {/* Avatar */}
        <div style={{ position: "relative" }}>
          {isPulsing && (
            <div
              style={{
                position: "absolute",
                inset: "-12px",
                borderRadius: "50%",
                background:
                  status === "speaking"
                    ? "rgba(59,130,246,0.2)"
                    : status === "listening"
                    ? "rgba(34,197,94,0.2)"
                    : "rgba(234,179,8,0.2)",
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
          )}
          <div
            style={{
              width: "96px",
              height: "96px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "40px",
              boxShadow: "0 8px 32px rgba(59,130,246,0.4)",
            }}
          >
            🤖
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "700",
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            AI Interviewer
          </h1>
          {interview && (
            <p
              style={{
                fontSize: "15px",
                color: "rgba(255,255,255,0.5)",
                margin: "6px 0 0",
              }}
            >
              Interviewing {interview.candidate_name}
            </p>
          )}
        </div>

        {/* Status pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 20px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "100px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              flexShrink: 0,
            }}
            className={`${statusColor[status]}${isPulsing ? " animate-pulse" : ""}`}
          />
          <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
            {statusText}
          </span>
        </div>

        {/* Transcript preview — last 3 messages */}
        {transcript.length > 0 && (
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              maxHeight: "180px",
              overflow: "hidden",
            }}
          >
            {transcript.slice(-3).map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                  opacity: i === 0 && transcript.length > 3 ? 0.4 : i === 1 && transcript.length > 3 ? 0.7 : 1,
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color:
                      msg.role === "interviewer"
                        ? "rgba(96,165,250,0.9)"
                        : "rgba(134,239,172,0.9)",
                    whiteSpace: "nowrap",
                    marginTop: "1px",
                    minWidth: "70px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {msg.role === "interviewer" ? "AI" : "Candidate"}
                </span>
                <p
                  style={{
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.65)",
                    margin: 0,
                    lineHeight: "1.5",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {msg.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
