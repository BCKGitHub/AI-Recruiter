import { useState } from "react";
import SetupInterview from "./pages/SetupInterview";
import ActiveInterviews from "./pages/ActiveInterviews";
import TranscriptAssessment from "./pages/TranscriptAssessment";
import AgentPage from "./pages/AgentPage";
import { PlusCircleIcon, ListIcon, BriefcaseIcon } from "lucide-react";

type Page = "setup" | "interviews" | "transcript";

export default function App() {
  // The /agent route runs inside the Recall bot's headless browser — render it standalone
  if (window.location.pathname === "/agent") {
    return <AgentPage />;
  }

  const [page, setPage] = useState<Page>("setup");
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleInterviewCreated = () => {
    setRefreshTrigger((n) => n + 1);
  };

  const handleSelectInterview = (id: string) => {
    setSelectedInterviewId(id);
    setPage("transcript");
  };

  const handleBackToInterviews = () => {
    setSelectedInterviewId(null);
    setPage("interviews");
  };

  const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: "setup", label: "Setup Interview", icon: <PlusCircleIcon size={16} /> },
    { id: "interviews", label: "Active Interviews", icon: <ListIcon size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <BriefcaseIcon size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none">RecruiterAI</p>
              <p className="text-xs text-gray-400 mt-0.5">Interview Dashboard</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = page === item.id || (item.id === "interviews" && page === "transcript");
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id !== "transcript") {
                    setSelectedInterviewId(null);
                    setPage(item.id);
                  }
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className={isActive ? "text-blue-600" : "text-gray-400"}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">Powered by Recall.ai + Claude</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-8">
          {page === "setup" && (
            <SetupInterview onInterviewCreated={handleInterviewCreated} />
          )}
          {page === "interviews" && (
            <ActiveInterviews
              onSelectInterview={handleSelectInterview}
              refreshTrigger={refreshTrigger}
            />
          )}
          {page === "transcript" && selectedInterviewId && (
            <TranscriptAssessment
              interviewId={selectedInterviewId}
              onBack={handleBackToInterviews}
            />
          )}
        </div>
      </main>
    </div>
  );
}
