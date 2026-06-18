import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import {
  BriefcaseIcon, UserIcon, MailIcon, LinkIcon, FileTextIcon,
  CheckCircleIcon, AlertCircleIcon, Loader2Icon, ActivityIcon,
  ClockIcon, XCircleIcon,
} from "lucide-react";

interface Props {
  onInterviewCreated: () => void;
}

type BotStatus =
  | "creating"
  | "joining_call"
  | "waiting_for_host"
  | "in_call"
  | "call_ended"
  | "fatal"
  | "error"
  | "unknown";

const BOT_STATUS_CONFIG: Record<BotStatus, { label: string; color: string; icon: React.ReactNode; detail: string }> = {
  creating:         { label: "Creating bot...",          color: "text-blue-600",   icon: <Loader2Icon size={14} className="animate-spin" />, detail: "Sending bot to Recall.ai" },
  joining_call:     { label: "Bot joining call...",      color: "text-amber-600",  icon: <Loader2Icon size={14} className="animate-spin" />, detail: "Bot is connecting to the Zoom meeting" },
  waiting_for_host: { label: "Waiting for host",        color: "text-amber-600",  icon: <ClockIcon size={14} />, detail: "Bot is in the waiting room — admit it from the Zoom participant panel" },
  in_call:          { label: "Bot is live in the call!", color: "text-emerald-600",icon: <CheckCircleIcon size={14} />, detail: "AI Interviewer has joined the meeting" },
  call_ended:       { label: "Call ended",              color: "text-gray-500",   icon: <CheckCircleIcon size={14} />, detail: "The interview session has ended" },
  fatal:            { label: "Bot failed to join",      color: "text-red-600",    icon: <XCircleIcon size={14} />, detail: "Recall.ai could not connect to the meeting — check credentials/credits" },
  error:            { label: "Bot error",               color: "text-red-600",    icon: <XCircleIcon size={14} />, detail: "An error occurred in the bot session" },
  unknown:          { label: "Checking status...",      color: "text-gray-500",   icon: <Loader2Icon size={14} className="animate-spin" />, detail: "" },
};

function parseBotStatus(data: Record<string, unknown>): { status: BotStatus; subCode: string } {
  const changes = data.status_changes as { code: string; sub_code?: string }[] | undefined;
  if (changes && changes.length > 0) {
    const latest = changes[changes.length - 1];
    const status = (latest.code in BOT_STATUS_CONFIG ? latest.code : "unknown") as BotStatus;
    return { status, subCode: latest.sub_code ?? "" };
  }
  const status = data.status as string | undefined;
  if (status && status in BOT_STATUS_CONFIG) return { status: status as BotStatus, subCode: "" };
  return { status: "unknown", subCode: "" };
}

export default function SetupInterview({ onInterviewCreated }: Props) {
  const [form, setForm] = useState({
    candidateName: "",
    candidateEmail: "",
    zoomUrl: "",
    jobDescription: "",
    resume: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [botId, setBotId] = useState<string | null>(null);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [botRawStatus, setBotRawStatus] = useState<string>("");
  const [botSubCode, setBotSubCode] = useState<string>("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    pollCountRef.current = 0;
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  const startPolling = (id: string, ivId: string) => {
    stopPolling();
    pollCountRef.current = 0;
    setBotStatus("joining_call");

    pollRef.current = setInterval(async () => {
      pollCountRef.current += 1;

      // Stop after ~45 seconds (15 polls × 3s)
      if (pollCountRef.current > 15) {
        stopPolling();
        // Bot never responded — mark as Failed
        await supabase.from("interviews").update({ status: "Failed" }).eq("id", ivId);
        setBotStatus("fatal");
        return;
      }

      try {
        const res = await fetch(
          `${supabaseUrl}/functions/v1/create-recall-bot?botId=${encodeURIComponent(id)}`,
          {
            headers: {
              Authorization: `Bearer ${supabaseAnonKey}`,
              Apikey: supabaseAnonKey,
            },
          }
        );
        if (!res.ok) return;
        const data = await res.json() as Record<string, unknown>;
        const { status, subCode } = parseBotStatus(data);
        setBotStatus(status);
        if (subCode) setBotSubCode(subCode);

        const changes = data.status_changes as { code: string; sub_code?: string }[] | undefined;
        if (changes && changes.length > 0) {
          setBotRawStatus(
            changes.map((c) => (c.sub_code ? `${c.code}(${c.sub_code})` : c.code)).join(" → ")
          );
        }

        if (status === "in_call") {
          await supabase.from("interviews").update({ status: "In Progress" }).eq("id", ivId);
          stopPolling();
        } else if (status === "fatal" || status === "error") {
          await supabase.from("interviews").update({ status: "Failed" }).eq("id", ivId);
          stopPolling();
        } else if (status === "call_ended") {
          stopPolling();
        }
      } catch {
        // silently retry
      }
    }, 3000);
  };

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setBotId(null);
    setInterviewId(null);
    setBotStatus(null);
    setBotRawStatus("");
    setBotSubCode("");
    stopPolling();

    try {
      const { data: interview, error: insertError } = await supabase
        .from("interviews")
        .insert({
          candidate_name: form.candidateName,
          candidate_email: form.candidateEmail,
          zoom_url: form.zoomUrl,
          job_description: form.jobDescription,
          resume: form.resume,
          status: "Scheduled",
          recall_bot_id: null,
          transcript: null,
          assessment: null,
        })
        .select()
        .maybeSingle();

      if (insertError || !interview) {
        throw new Error(insertError?.message || "Failed to save interview");
      }

      const fnUrl = `${supabaseUrl}/functions/v1/create-recall-bot`;
      const response = await fetch(fnUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
          Apikey: supabaseAnonKey,
        },
        body: JSON.stringify({
          interviewId: interview.id,
          zoomUrl: form.zoomUrl,
          candidateName: form.candidateName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({
          success: false,
          message: `Interview saved but bot creation failed: ${data.error || "Unknown error"}`,
        });
      } else {
        setResult({
          success: true,
          message: `Interview scheduled for ${form.candidateName}. Bot (ID: ${data.botId}) dispatched.`,
        });
        setBotId(data.botId);
        setInterviewId(interview.id);
        setBotStatus("creating");
        startPolling(data.botId, interview.id);
        setForm({ candidateName: "", candidateEmail: "", zoomUrl: "", jobDescription: "", resume: "" });
        onInterviewCreated();
      }
    } catch (err) {
      setResult({ success: false, message: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const isValid =
    form.candidateName.trim() &&
    form.candidateEmail.trim() &&
    form.zoomUrl.trim() &&
    form.jobDescription.trim() &&
    form.resume.trim();

  const currentStatusCfg = botStatus ? BOT_STATUS_CONFIG[botStatus] : null;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Setup Interview</h1>
        <p className="mt-1 text-sm text-gray-500">Configure a new AI-assisted interview session</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Candidate Info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <UserIcon size={14} className="text-gray-400" />
              Candidate Information
            </h2>
          </div>
          <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <UserIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={form.candidateName}
                  onChange={handleChange("candidateName")}
                  placeholder="Jane Doe"
                  required
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <MailIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={form.candidateEmail}
                  onChange={handleChange("candidateEmail")}
                  placeholder="jane@example.com"
                  required
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Zoom Meeting URL <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <LinkIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="url"
                  value={form.zoomUrl}
                  onChange={handleChange("zoomUrl")}
                  placeholder="https://zoom.us/j/123456789?pwd=..."
                  required
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-400">
                Use the standard Zoom URL format. Avoid <code className="bg-gray-100 px-1 rounded">us04web.zoom.us</code> — use <code className="bg-gray-100 px-1 rounded">zoom.us/j/MEETING_ID?pwd=...</code> instead.
              </p>
            </div>
          </div>
        </div>

        {/* Job Description */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <BriefcaseIcon size={14} className="text-gray-400" />
              Job Description
            </h2>
          </div>
          <div className="px-6 py-5">
            <textarea
              value={form.jobDescription}
              onChange={handleChange("jobDescription")}
              placeholder="Paste the full job description here..."
              required
              rows={8}
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none font-mono leading-relaxed"
            />
          </div>
        </div>

        {/* Resume */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <FileTextIcon size={14} className="text-gray-400" />
              Candidate Resume
            </h2>
          </div>
          <div className="px-6 py-5">
            <textarea
              value={form.resume}
              onChange={handleChange("resume")}
              placeholder="Paste the candidate's resume here..."
              required
              rows={10}
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none font-mono leading-relaxed"
            />
          </div>
        </div>

        {/* Result + Live Bot Status */}
        {result && (
          <div
            className={`rounded-xl border overflow-hidden ${
              result.success ? "border-emerald-200" : "border-red-200"
            }`}
          >
            <div
              className={`flex items-start gap-3 px-5 py-4 text-sm ${
                result.success ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
              }`}
            >
              {result.success ? (
                <CheckCircleIcon size={18} className="text-emerald-500 mt-0.5 shrink-0" />
              ) : (
                <AlertCircleIcon size={18} className="text-red-500 mt-0.5 shrink-0" />
              )}
              <p>{result.message}</p>
            </div>

            {/* Live bot status panel */}
            {botId && currentStatusCfg && (
              <div className="bg-white px-5 py-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <ActivityIcon size={11} />
                    Live Bot Status
                  </span>
                  <span className="text-xs text-gray-400 font-mono">{botId}</span>
                </div>

                <div className={`flex items-center gap-2 font-medium text-sm ${currentStatusCfg.color}`}>
                  {currentStatusCfg.icon}
                  {currentStatusCfg.label}
                </div>

                {currentStatusCfg.detail && (
                  <p className="mt-1 text-xs text-gray-500">{currentStatusCfg.detail}</p>
                )}

                {botRawStatus && (
                  <p className="mt-2 text-xs text-gray-400 font-mono">Status history: {botRawStatus}</p>
                )}

                {botStatus === "fatal" && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 space-y-1.5">
                    {botSubCode && (
                      <p className="font-semibold font-mono">
                        Recall error: <span className="underline">{botSubCode}</span>
                      </p>
                    )}
                    <p className="font-semibold">Common causes:</p>
                    <ul className="list-disc ml-4 space-y-0.5">
                      <li><strong>Zoom app not connected</strong> — in your Recall.ai dashboard go to <em>Settings &gt; Integrations &gt; Zoom</em> and install the Recall Zoom App. This is required to join meetings.</li>
                      <li>The Zoom meeting ended before the bot could join</li>
                      <li>Waiting room enabled — admit the bot named <em>AI Interviewer</em> from the Zoom participants panel</li>
                    </ul>
                  </div>
                )}

                {botStatus === "waiting_for_host" && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                    <strong>Action required:</strong> The bot is in the Zoom waiting room. Open the meeting as host and admit <strong>AI Interviewer</strong> from the participants panel.
                  </div>
                )}

                {botStatus === "in_call" && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
                    The AI Interviewer has successfully joined the meeting and is ready to conduct the interview.
                  </div>
                )}

                {pollRef.current && (
                  <p className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                    <Loader2Icon size={10} className="animate-spin" />
                    Polling every 3s...
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end pb-8">
          <button
            type="submit"
            disabled={loading || !isValid}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2Icon size={16} className="animate-spin" />
                Starting Interview...
              </>
            ) : (
              <>
                <LinkIcon size={16} />
                Start Interview
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
