import { useState } from "react";
import { supabase } from "../lib/supabase";
import { BriefcaseIcon, UserIcon, MailIcon, LinkIcon, FileTextIcon, CheckCircleIcon, AlertCircleIcon, Loader2Icon } from "lucide-react";

interface Props {
  onInterviewCreated: () => void;
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

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // 1. Save interview to Supabase
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

      // 2. Call edge function to create Recall.ai bot
      const fnUrl = `${supabaseUrl}/functions/v1/create-recall-bot`;
      const response = await fetch(fnUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseAnonKey}`,
          "Apikey": supabaseAnonKey,
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
          message: `Interview saved but bot creation failed: ${data.error || "Unknown error"}. The interview is still scheduled.`,
        });
      } else {
        setResult({
          success: true,
          message: `Interview scheduled for ${form.candidateName}. Bot (ID: ${data.botId}) is joining the Zoom meeting.`,
        });
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
                  placeholder="https://zoom.us/j/123456789"
                  required
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
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

        {/* Result Message */}
        {result && (
          <div
            className={`flex items-start gap-3 px-5 py-4 rounded-xl border text-sm ${
              result.success
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {result.success ? (
              <CheckCircleIcon size={18} className="text-emerald-500 mt-0.5 shrink-0" />
            ) : (
              <AlertCircleIcon size={18} className="text-red-500 mt-0.5 shrink-0" />
            )}
            <p>{result.message}</p>
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
