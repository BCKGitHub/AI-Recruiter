export interface TranscriptMessage {
  role: "interviewer" | "candidate";
  content: string;
  timestamp?: string;
}

export interface Assessment {
  technicalSkillsMatch: number;
  technicalSkillsRationale: string;
  technicalSkillsQuote: string;
  communicationClarity: number;
  communicationRationale: string;
  communicationQuote: string;
  depthOfExperience: number;
  depthRationale: string;
  depthQuote: string;
  cultureFitIndicators: string[];
  overallRecommendation: "Strong Yes" | "Yes" | "Maybe" | "No";
  recommendationSummary: string;
}

export interface Interview {
  id: string;
  candidate_name: string;
  candidate_email: string;
  job_description: string;
  resume: string;
  zoom_url: string;
  recall_bot_id: string | null;
  status: "Scheduled" | "In Progress" | "Completed";
  transcript: TranscriptMessage[] | null;
  assessment: Assessment | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      interviews: {
        Row: Interview;
        Insert: Omit<Interview, "id" | "created_at">;
        Update: Partial<Omit<Interview, "id" | "created_at">>;
      };
    };
  };
}
