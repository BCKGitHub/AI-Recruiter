import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Interview, Assessment, TranscriptMessage } from "../lib/database.types";
import {
  ArrowLeftIcon,
  SparklesIcon,
  Loader2Icon,
  AlertCircleIcon,
  MessageSquareIcon,
  StarIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  MinusIcon,
  QuoteIcon,
  CheckCircle2Icon,
} from "lucide-react";

interface Props {
  interviewId: string;
  onBack: () => void;
}

const RECOMMENDATION_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  "Strong Yes": {
    label: "Strong Yes",
    className: "bg-emerald-50 text-emerald-700 border-emerald-300",
    icon: <ThumbsUpIcon size={16} />,
  },
  Yes: {
    label: "Yes",
    className: "bg-blue-50 text-blue-700 border-blue-300",
    icon: <CheckCircle2Icon size={16} />,
  },
  Maybe: {
    label: "Maybe",
    className: "bg-amber-50 text-amber-700 border-amber-300",
    icon: <MinusIcon size={16} />,
  },
  No: {
    label: "No",
    className: "bg-red-50 text-red-700 border-red-300",
    icon: <ThumbsDownIcon size={16} />,
  },
};

function ScoreBar({ score, label }: { score: number; label: string }) {
  const pct = (score / 10) * 100;
  const color =
    score >= 8 ? "bg-emerald-500" : score >= 6 ? "bg-blue-500" : score >= 4 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-36 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-900 w-8 text-right">{score}/10</span>
    </div>
  );
}

function ScoreCard({
  score,
  label,
  rationale,
  quote,
}: {
  score: number;
  label: string;
  rationale: string;
  quote: string;
}) {
  const color =
    score >= 8 ? "text-emerald-600 bg-emerald-50 border-emerald-200"
    : score >= 6 ? "text-blue-600 bg-blue-50 border-blue-200"
    : score >= 4 ? "text-amber-600 bg-amber-50 border-amber-200"
    : "text-red-600 bg-red-50 border-red-200";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-sm">{label}</h3>
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${color}`}>
          {score}/10
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            score >= 8 ? "bg-emerald-500" : score >= 6 ? "bg-blue-500" : score >= 4 ? "bg-amber-500" : "bg-red-500"
          }`}
          style={{ width: `${(score / 10) * 100}%` }}
        />
      </div>
      <p className="text-sm text-gray-600">{rationale}</p>
      {quote && (
        <div className="flex gap-2 bg-gray-50 rounded-lg p-3 border border-gray-100">
          <QuoteIcon size={14} className="text-gray-400 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 italic">{quote}</p>
        </div>
      )}
    </div>
  );
}

export default function TranscriptAssessment({ interviewId, onBack }: Props) {
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  const fetchInterview = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("interviews")
      .select("*")
      .eq("id", interviewId)
      .maybeSingle();

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setInterview(data as Interview);
    }
    setLoading(false);
  }, [interviewId]);

  useEffect(() => {
    fetchInterview();
  }, [fetchInterview]);

  const handleGenerateAssessment = async () => {
    setGenerating(true);
    setError(null);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-assessment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
          Apikey: supabaseAnonKey,
        },
        body: JSON.stringify({ interviewId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate assessment");
      }
      await fetchInterview();
    } catch (err) {
      setError(String(err));
    } finally {
      setGenerating(false);
    }
  };

  const transcript: TranscriptMessage[] = interview?.transcript || [];
  const assessment: Assessment | null = interview?.assessment ?? null;
  const recCfg = assessment
    ? RECOMMENDATION_CONFIG[assessment.overallRecommendation] || RECOMMENDATION_CONFIG["Maybe"]
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2Icon size={24} className="animate-spin mr-3" />
        <span className="text-sm">Loading interview...</span>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="text-center py-24 text-gray-500 text-sm">Interview not found.</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition mb-4"
        >
          <ArrowLeftIcon size={14} />
          Back to interviews
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{interview.candidate_name}</h1>
            <p className="text-sm text-gray-500 mt-1">{interview.candidate_email}</p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${
              interview.status === "Completed"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : interview.status === "In Progress"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}
          >
            {interview.status}
          </span>
        </div>
      </div>

      {/* Transcript */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <MessageSquareIcon size={14} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Interview Transcript
          </h2>
          {transcript.length > 0 && (
            <span className="ml-auto text-xs text-gray-400">{transcript.length} messages</span>
          )}
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[480px] overflow-y-auto">
          {transcript.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <MessageSquareIcon size={20} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-500">No transcript available yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Transcript will appear here once the interview is underway
              </p>
            </div>
          ) : (
            transcript.map((msg, i) => {
              const isInterviewer = msg.role === "interviewer";
              return (
                <div
                  key={i}
                  className={`flex gap-3 ${isInterviewer ? "flex-row" : "flex-row-reverse"}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold ${
                      isInterviewer
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {isInterviewer ? "AI" : interview.candidate_name.charAt(0).toUpperCase()}
                  </div>
                  <div
                    className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      isInterviewer
                        ? "bg-blue-50 text-blue-900 rounded-tl-sm"
                        : "bg-gray-100 text-gray-900 rounded-tr-sm"
                    }`}
                  >
                    {msg.content}
                    {msg.timestamp && (
                      <p
                        className={`text-xs mt-1.5 ${
                          isInterviewer ? "text-blue-400" : "text-gray-400"
                        }`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Generate Assessment Button */}
      {!assessment && (
        <div className="flex justify-center mb-8">
          <button
            onClick={handleGenerateAssessment}
            disabled={generating}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            {generating ? (
              <>
                <Loader2Icon size={16} className="animate-spin" />
                Generating Assessment...
              </>
            ) : (
              <>
                <SparklesIcon size={16} />
                Generate Assessment
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-start gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircleIcon size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Assessment */}
      {assessment && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <SparklesIcon size={18} className="text-gray-500" />
              AI Assessment
            </h2>
            <button
              onClick={handleGenerateAssessment}
              disabled={generating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
            >
              {generating ? (
                <Loader2Icon size={12} className="animate-spin" />
              ) : (
                <SparklesIcon size={12} />
              )}
              Regenerate
            </button>
          </div>

          {/* Overall Recommendation */}
          {recCfg && (
            <div className={`rounded-xl border-2 px-6 py-5 ${recCfg.className}`}>
              <div className="flex items-center gap-3 mb-2">
                {recCfg.icon}
                <span className="font-bold text-lg">Overall: {assessment.overallRecommendation}</span>
              </div>
              <p className="text-sm opacity-80">{assessment.recommendationSummary}</p>
            </div>
          )}

          {/* Score Overview */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-5 flex items-center gap-2">
              <StarIcon size={14} className="text-gray-400" />
              Score Summary
            </h3>
            <div className="space-y-3.5">
              <ScoreBar score={assessment.technicalSkillsMatch} label="Technical Skills" />
              <ScoreBar score={assessment.communicationClarity} label="Communication" />
              <ScoreBar score={assessment.depthOfExperience} label="Depth of Experience" />
            </div>
          </div>

          {/* Detailed Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ScoreCard
              score={assessment.technicalSkillsMatch}
              label="Technical Skills Match"
              rationale={assessment.technicalSkillsRationale}
              quote={assessment.technicalSkillsQuote}
            />
            <ScoreCard
              score={assessment.communicationClarity}
              label="Communication Clarity"
              rationale={assessment.communicationRationale}
              quote={assessment.communicationQuote}
            />
            <ScoreCard
              score={assessment.depthOfExperience}
              label="Depth of Experience"
              rationale={assessment.depthRationale}
              quote={assessment.depthQuote}
            />
          </div>

          {/* Culture Fit */}
          {assessment.cultureFitIndicators?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Culture Fit Indicators
              </h3>
              <ul className="space-y-2">
                {assessment.cultureFitIndicators.map((indicator, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckCircle2Icon size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                    {indicator}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
