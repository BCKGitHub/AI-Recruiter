import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Interview } from "../lib/database.types";
import {
  RefreshCwIcon,
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircle2Icon,
  Loader2Icon,
  InboxIcon,
  ActivityIcon,
  XIcon,
  XCircleIcon,
} from "lucide-react";

interface Props {
  onSelectInterview: (id: string) => void;
  refreshTrigger: number;
}

const STATUS_CONFIG: Record<
  Interview["status"],
  { label: string; className: string; icon: React.ReactNode }
> = {
  Scheduled: {
    label: "Scheduled",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    icon: <CalendarIcon size={12} />,
  },
  "In Progress": {
    label: "In Progress",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <ClockIcon size={12} />,
  },
  Completed: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2Icon size={12} />,
  },
  Failed: {
    label: "Failed",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: <XCircleIcon size={12} />,
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface BotStatusModal {
  botId: string;
  candidateName: string;
  data: Record<string, unknown> | null;
  loading: boolean;
  error: string | null;
}

export default function ActiveInterviews({ onSelectInterview, refreshTrigger }: Props) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [botStatus, setBotStatus] = useState<BotStatusModal | null>(null);

  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("interviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setInterviews((data as Interview[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews, refreshTrigger]);

  const checkBotStatus = async (e: React.MouseEvent, interview: Interview) => {
    e.stopPropagation();
    if (!interview.recall_bot_id) return;

    setBotStatus({
      botId: interview.recall_bot_id,
      candidateName: interview.candidate_name,
      data: null,
      loading: true,
      error: null,
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      const res = await fetch(
        `${supabaseUrl}/functions/v1/create-recall-bot?botId=${encodeURIComponent(interview.recall_bot_id)}`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token ?? anonKey}`,
            Apikey: anonKey,
          },
        }
      );
      const json = await res.json();
      setBotStatus((prev) => prev ? { ...prev, loading: false, data: json } : null);
    } catch (err) {
      setBotStatus((prev) => prev ? { ...prev, loading: false, error: String(err) } : null);
    }
  };

  const recallStatus = botStatus?.data
    ? ((botStatus.data as Record<string, unknown>).status_changes as {code: string; created_at: string}[] | undefined)?.at(-1)?.code
      ?? ((botStatus.data as Record<string, unknown>).status as string | undefined)
      ?? "unknown"
    : null;

  const statusColor =
    recallStatus === "ready" || recallStatus === "in_call" ? "text-emerald-600" :
    recallStatus === "joining_call" ? "text-amber-600" :
    recallStatus === "fatal" || recallStatus === "error" ? "text-red-600" :
    "text-gray-600";

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Active Interviews</h1>
          <p className="mt-1 text-sm text-gray-500">
            {interviews.length} interview{interviews.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <button
          onClick={fetchInterviews}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
        >
          <RefreshCwIcon size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-400">
          <Loader2Icon size={24} className="animate-spin mr-3" />
          <span className="text-sm">Loading interviews...</span>
        </div>
      ) : interviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <InboxIcon size={28} className="text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">No interviews yet</p>
          <p className="text-sm text-gray-400 mt-1">Set up your first interview to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Candidate
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Email
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Date
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Transcript
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Bot
                </th>
                <th className="px-6 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {interviews.map((interview) => {
                const statusCfg = STATUS_CONFIG[interview.status] || STATUS_CONFIG["Scheduled"];
                const msgCount = interview.transcript?.length ?? 0;
                return (
                  <tr
                    key={interview.id}
                    onClick={() => onSelectInterview(interview.id)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
                          {interview.candidate_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900 text-sm">
                          {interview.candidate_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{interview.candidate_email}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(interview.created_at)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${statusCfg.className}`}
                      >
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {msgCount > 0 ? (
                        <span className="text-emerald-600 font-medium">{msgCount} messages</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {interview.recall_bot_id ? (
                        <button
                          onClick={(e) => checkBotStatus(e, interview)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-full hover:bg-blue-100 transition"
                        >
                          <ActivityIcon size={11} />
                          Check status
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRightIcon
                        size={16}
                        className="text-gray-400 group-hover:text-blue-500 transition-colors ml-auto"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Bot Status Modal */}
      {botStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">Recall.ai Bot Status</h2>
                <p className="text-xs text-gray-500 mt-0.5">{botStatus.candidateName} · {botStatus.botId}</p>
              </div>
              <button
                onClick={() => setBotStatus(null)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
              >
                <XIcon size={13} />
              </button>
            </div>

            <div className="px-6 py-5">
              {botStatus.loading ? (
                <div className="flex items-center gap-3 text-gray-500">
                  <Loader2Icon size={18} className="animate-spin" />
                  <span className="text-sm">Fetching bot status from Recall.ai...</span>
                </div>
              ) : botStatus.error ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {botStatus.error}
                </div>
              ) : (
                <>
                  {recallStatus && (
                    <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-500 font-medium">Current status:</span>
                      <span className={`font-bold text-sm uppercase tracking-wide ${statusColor}`}>
                        {recallStatus}
                      </span>
                      {(recallStatus === "fatal" || recallStatus === "error") && (
                        <span className="text-xs text-red-500 ml-auto">Bot failed to join</span>
                      )}
                      {recallStatus === "joining_call" && (
                        <span className="text-xs text-amber-500 ml-auto">Bot is joining...</span>
                      )}
                      {recallStatus === "in_call" && (
                        <span className="text-xs text-emerald-500 ml-auto">Bot is in the call</span>
                      )}
                    </div>
                  )}
                  <pre className="text-xs bg-gray-900 text-gray-100 rounded-lg p-4 overflow-auto max-h-72 leading-relaxed">
                    {JSON.stringify(botStatus.data, null, 2)}
                  </pre>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              <p className="text-xs text-gray-400">
                Status codes: joining_call → in_call → call_ended · fatal = failed to join
              </p>
              <button
                onClick={() => setBotStatus(null)}
                className="px-4 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
