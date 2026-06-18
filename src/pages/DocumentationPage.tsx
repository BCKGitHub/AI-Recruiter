export default function DocumentationPage() {
  const handlePrint = () => window.print();

  return (
    <>
      <style>{`
        @media print {
          .doc-no-print { display: none !important; }
          .doc-page-break { page-break-before: always; }
          .doc-sidebar { display: none !important; }
          .doc-main { margin: 0 !important; padding: 0 !important; }
          body { background: white !important; }
        }
        .doc-body h1 { font-size: 32px; font-weight: 800; color: #0f172a; letter-spacing: -1px; margin-bottom: 8px; }
        .doc-body h2 { font-size: 22px; font-weight: 700; color: #0f172a; margin: 40px 0 14px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
        .doc-body h3 { font-size: 17px; font-weight: 700; color: #1e40af; margin: 24px 0 10px; }
        .doc-body h4 { font-size: 14px; font-weight: 700; color: #374151; margin: 18px 0 6px; }
        .doc-body p { margin-bottom: 12px; color: #334155; line-height: 1.75; }
        .doc-body ul, .doc-body ol { margin: 8px 0 14px 22px; }
        .doc-body li { margin-bottom: 5px; color: #334155; line-height: 1.7; }
        .doc-body strong { color: #0f172a; }
        .doc-body table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 13px; }
        .doc-body th { background: #1e40af; color: #fff; text-align: left; padding: 9px 12px; font-size: 12px; }
        .doc-body td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; vertical-align: top; }
        .doc-body tr:nth-child(even) td { background: #f8fafc; }
        .doc-body pre { background: #0f172a; color: #e2e8f0; border-radius: 8px; padding: 16px 18px; font-size: 12px; line-height: 1.6; overflow-x: auto; margin: 12px 0; font-family: 'Courier New', monospace; }
        .doc-body code { background: #f1f5f9; color: #be123c; padding: 2px 5px; border-radius: 4px; font-size: 12px; font-family: 'Courier New', monospace; }
        .doc-body pre code { background: transparent; color: inherit; padding: 0; }
        .doc-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin: 14px 0; }
        .doc-card.blue { background: #eff6ff; border-color: #bfdbfe; }
        .doc-card.amber { background: #fffbeb; border-color: #fde68a; }
        .doc-card.purple { background: #faf5ff; border-color: #ddd6fe; }
        .doc-callout { border-left: 4px solid #2563eb; background: #eff6ff; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 14px 0; font-size: 13px; color: #1e40af; }
        .doc-callout.tip { border-color: #16a34a; background: #f0fdf4; color: #166534; }
        .doc-callout.warn { border-color: #d97706; background: #fffbeb; color: #92400e; }
        .doc-badge { display: inline-block; padding: 2px 7px; border-radius: 100px; font-size: 11px; font-weight: 700; vertical-align: middle; }
        .doc-badge.react { background: #dbeafe; color: #1d4ed8; }
        .doc-badge.ts { background: #ede9fe; color: #6d28d9; }
        .doc-badge.supabase { background: #d1fae5; color: #065f46; }
        .doc-badge.deno { background: #fef3c7; color: #92400e; }
        .doc-badge.ai { background: #fce7f3; color: #9d174d; }
        .doc-snum { display: inline-block; background: #2563eb; color: #fff; border-radius: 5px; padding: 1px 9px; font-size: 11px; font-weight: 700; margin-right: 6px; vertical-align: middle; }
        .doc-flow-step { display: flex; align-items: flex-start; gap: 14px; padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 2px; }
        .doc-flow-num { width: 28px; height: 28px; border-radius: 50%; background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0; }
        .doc-flow-conn { width: 2px; height: 10px; background: #cbd5e1; margin-left: 27px; }
        .doc-toc { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px 24px; margin: 20px 0; }
        .doc-toc ol { margin-left: 18px; }
        .doc-toc li { margin-bottom: 6px; font-size: 13px; }
        .doc-toc a { color: #2563eb; text-decoration: none; }
        .doc-toc a:hover { text-decoration: underline; }
        .doc-arch { background: #0f172a; color: #94a3b8; border-radius: 10px; padding: 22px; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.8; margin: 14px 0; white-space: pre; overflow-x: auto; }
        hr.doc-hr { border: none; border-top: 1px solid #e2e8f0; margin: 28px 0; }
      `}</style>

      <div className="max-w-4xl mx-auto pb-16 doc-body" style={{ fontFamily: "'Georgia', serif", fontSize: "15px" }}>

        {/* Header bar */}
        <div className="doc-no-print sticky top-0 z-10 bg-white border-b border-gray-200 px-0 py-3 mb-8 flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: "20px", marginBottom: "2px" }}>RecruiterAI — Project Documentation</h1>
            <p style={{ fontSize: "12px", color: "#64748b", marginBottom: 0 }}>Comprehensive guide for beginners · June 2026</p>
          </div>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>
            Download / Print as PDF
          </button>
        </div>

        {/* Cover */}
        <div style={{ textAlign: "center", padding: "48px 0 36px", borderBottom: "3px solid #2563eb", marginBottom: "40px" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 16 }}>💼</div>
          <h1 style={{ fontSize: 34, marginBottom: 6 }}>RecruiterAI</h1>
          <p style={{ fontSize: 16, color: "#64748b", fontFamily: "Arial,sans-serif" }}>Complete Project Documentation</p>
          <p style={{ marginTop: 14, color: "#475569", maxWidth: 520, marginLeft: "auto", marginRight: "auto", fontFamily: "Arial,sans-serif", fontSize: 14 }}>
            An AI-powered recruitment platform that conducts automated voice interviews, captures real-time transcripts, and generates intelligent candidate assessments.
          </p>
          <p style={{ marginTop: 16, fontSize: 12, color: "#94a3b8", fontFamily: "Arial,sans-serif" }}>Version 1.0 · June 2026 · Built with React, Supabase, OpenAI &amp; Claude AI</p>
        </div>

        {/* TOC */}
        <div className="doc-toc">
          <h3 style={{ marginTop: 0, color: "#0f172a", fontFamily: "Arial,sans-serif" }}>📋 Table of Contents</h3>
          <ol>
            <li><a href="#s1">What This App Does — The Big Picture</a></li>
            <li><a href="#s2">Technologies Used (Plain English)</a></li>
            <li><a href="#s3">Architecture — How All Pieces Connect</a></li>
            <li><a href="#s4">The Database — Where Data is Stored</a></li>
            <li><a href="#s5">Frontend Pages &amp; Components</a></li>
            <li><a href="#s6">Backend Edge Functions</a></li>
            <li><a href="#s7">The AI Voice Interview — Step by Step</a></li>
            <li><a href="#s8">Deployment &amp; Configuration</a></li>
            <li><a href="#s9">Key Bugs Fixed During Development</a></li>
            <li><a href="#s10">Glossary for Non-Technical Readers</a></li>
          </ol>
        </div>

        {/* ── Section 1 ── */}
        <h2 id="s1"><span className="doc-snum">1</span> What This App Does — The Big Picture</h2>
        <p>RecruiterAI is a web application designed to help recruiters and hiring managers run AI-powered job interviews automatically. Instead of a human interviewer spending time in every initial screening call, <strong>an AI voice agent</strong> joins the video meeting, asks smart questions, listens to the candidate's answers, and records everything. Afterwards, another AI reads the transcript and produces a structured scorecard for the recruiter to review.</p>

        <div className="doc-card blue">
          <h4>🎯 The Core Workflow in Plain English</h4>
          <ol>
            <li>A recruiter fills in a form with the candidate's name, email, Zoom link, job description, and resume.</li>
            <li>The app saves this information and dispatches a "bot" into the Zoom meeting.</li>
            <li>The bot displays an animated AI Interviewer screen and conducts a real voice conversation with the candidate.</li>
            <li>Everything said is transcribed and saved in real time.</li>
            <li>After the call, the recruiter clicks "Generate Assessment" and receives an AI-written scorecard with scores out of 10 and a hiring recommendation.</li>
          </ol>
        </div>

        <p>Think of it like this: the recruiter sets up the interview in 2 minutes, goes about their day, and comes back to a complete report about the candidate. No human interviewer needed for the screening round.</p>

        {/* ── Section 2 ── */}
        <h2 id="s2"><span className="doc-snum">2</span> Technologies Used (Plain English)</h2>
        <table>
          <thead><tr><th>Technology</th><th>What it is</th><th>What it does in this app</th></tr></thead>
          <tbody>
            <tr><td><strong>React</strong> <span className="doc-badge react">Frontend</span></td><td>A JavaScript library for building interactive web pages</td><td>Powers all the screens the recruiter sees</td></tr>
            <tr><td><strong>TypeScript</strong> <span className="doc-badge ts">Language</span></td><td>JavaScript with type safety — catches errors before the code runs</td><td>Used for all frontend code to prevent bugs</td></tr>
            <tr><td><strong>Tailwind CSS</strong></td><td>A utility-first CSS framework — style with short class names</td><td>All visual design: colors, spacing, layout</td></tr>
            <tr><td><strong>Vite</strong></td><td>A fast build tool that packages the code for production</td><td>Compiles and bundles the React app</td></tr>
            <tr><td><strong>Supabase</strong> <span className="doc-badge supabase">Backend</span></td><td>A cloud database service — like Google Sheets but for code</td><td>Stores all interview data in a PostgreSQL database</td></tr>
            <tr><td><strong>Supabase Edge Functions</strong> <span className="doc-badge deno">Backend</span></td><td>Small server programs that run in the cloud</td><td>Handle secure tasks: calling Recall.ai, calling Claude AI</td></tr>
            <tr><td><strong>OpenAI Realtime API</strong> <span className="doc-badge ai">AI Voice</span></td><td>An API that enables real-time speech-to-speech AI conversations</td><td>Powers the AI voice interviewer</td></tr>
            <tr><td><strong>WebRTC</strong></td><td>A browser standard for real-time audio/video communication</td><td>Creates the live voice connection between the browser and OpenAI</td></tr>
            <tr><td><strong>Recall.ai</strong></td><td>A service that sends a virtual bot into video meetings</td><td>Joins the Zoom call and displays the AI interviewer screen</td></tr>
            <tr><td><strong>Claude AI (Anthropic)</strong> <span className="doc-badge ai">AI</span></td><td>A large language model that understands and generates text</td><td>Reads the interview transcript and writes the candidate assessment</td></tr>
            <tr><td><strong>Netlify</strong></td><td>A web hosting service</td><td>Hosts the public-facing website</td></tr>
          </tbody>
        </table>

        {/* ── Section 3 ── */}
        <h2 id="s3"><span className="doc-snum">3</span> Architecture — How All Pieces Connect</h2>
        <p>The system is made up of three main zones: the <strong>frontend</strong> (what users see in their browser), the <strong>backend</strong> (cloud functions), and <strong>external services</strong> (OpenAI, Recall.ai, Claude). Here is how they connect:</p>

        <div className="doc-arch">{`RECRUITER'S BROWSER (Netlify)
┌────────────────────────────────────────────────────────────┐
│  React App                                                 │
│  ┌─────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Setup Form  │  │ Interview List   │  │ Scorecard    │  │
│  └──────┬──────┘  └────────┬─────────┘  └──────────────┘  │
└─────────┼──────────────────┼────────────────────────────── ┘
          │ HTTPS calls       │ HTTPS reads
SUPABASE BACKEND
┌─────────┴──────────────────┴──────────────────────────────┐
│  PostgreSQL Database                                       │
│  interviews table: id, name, transcript, assessment, ...   │
│                                                            │
│  Edge Functions (serverless Deno programs)                 │
│  ┌──────────────────┐  ┌────────────────────────────────┐  │
│  │ create-recall-bot│  │ openai-realtime-token          │  │
│  │ generate-assess  │  │ recall-transcript-webhook      │  │
│  └────────┬─────────┘  └──────────────────────┬─────────┘  │
└───────────┼─────────────────────────────────── ┼───────────┘
            │ API calls                           │ callbacks
EXTERNAL SERVICES
┌───────────┴────────────┐  ┌───────────────────┴──────────┐
│  Recall.ai             │  │  OpenAI Realtime API         │
│  Bot joins Zoom meeting│  │  gpt-realtime-2 voice model  │
│  Displays AgentPage UI │  │  Speaks + listens to cand.   │
└────────────────────────┘  └──────────────────────────────┘
┌──────────────────────────────┐
│  Anthropic Claude AI         │
│  Reads transcript → scores   │
└──────────────────────────────┘`}</div>

        <div className="doc-callout">
          <strong>Key insight:</strong> The recruiter's browser never holds API keys for OpenAI or Recall.ai. All secret keys are stored securely in Supabase Edge Functions, which act as a trusted middleman.
        </div>

        {/* ── Section 4 ── */}
        <h2 id="s4"><span className="doc-snum">4</span> The Database — Where Data is Stored</h2>
        <p>All interview data is stored in a single table called <code>interviews</code> on Supabase's PostgreSQL database. Think of it as a very powerful spreadsheet where each row is one interview.</p>

        <h3>The <code>interviews</code> Table</h3>
        <table>
          <thead><tr><th>Column</th><th>Type</th><th>What it stores</th><th>Example</th></tr></thead>
          <tbody>
            <tr><td><code>id</code></td><td>UUID</td><td>Unique identifier auto-generated for every interview</td><td><code>3a9f2c11-...</code></td></tr>
            <tr><td><code>candidate_name</code></td><td>Text</td><td>The candidate's full name</td><td>Jane Doe</td></tr>
            <tr><td><code>candidate_email</code></td><td>Text</td><td>The candidate's email address</td><td>jane@example.com</td></tr>
            <tr><td><code>job_description</code></td><td>Text</td><td>The full job description pasted by the recruiter</td><td>"We are looking for a Senior React developer..."</td></tr>
            <tr><td><code>resume</code></td><td>Text</td><td>The candidate's resume text</td><td>"Jane has 5 years experience in..."</td></tr>
            <tr><td><code>zoom_url</code></td><td>Text</td><td>The Zoom (or Meet/Teams) meeting link</td><td>https://zoom.us/j/123456789</td></tr>
            <tr><td><code>recall_bot_id</code></td><td>Text</td><td>The ID of the Recall.ai bot that joined the meeting</td><td><code>bot_abc123</code></td></tr>
            <tr><td><code>status</code></td><td>Text</td><td>Where the interview is in its lifecycle</td><td>Scheduled / In Progress / Completed</td></tr>
            <tr><td><code>transcript</code></td><td>JSONB</td><td>Array of all messages spoken during the interview</td><td><code>[&#123;"role":"interviewer","content":"Hello..."&#125;]</code></td></tr>
            <tr><td><code>assessment</code></td><td>JSONB</td><td>Claude AI-generated scorecard with scores and recommendation</td><td><code>&#123;"technicalSkillsMatch": 8, ...&#125;</code></td></tr>
            <tr><td><code>created_at</code></td><td>Timestamp</td><td>When the interview was created</td><td>2026-06-16 10:30:00 UTC</td></tr>
          </tbody>
        </table>

        <div className="doc-card amber">
          <h4>⚠️ What is JSONB?</h4>
          <p style={{ margin: 0 }}>JSONB is a flexible data type that stores structured data as JSON. Instead of having 50 separate columns for each transcript message, the entire conversation is stored as one field containing a list of objects.</p>
        </div>

        {/* ── Section 5 ── */}
        <h2 id="s5"><span className="doc-snum">5</span> Frontend Pages &amp; Components</h2>
        <p>The frontend is a <strong>Single Page Application (SPA)</strong> — the entire app lives in one HTML file and React swaps different views without navigating to a new page.</p>

        <h3>5.1 — App.tsx: The Main Shell</h3>
        <p><code>App.tsx</code> is the root component — the outermost wrapper. It has two jobs: <strong>route detection</strong> (if the URL is <code>/agent</code>, show the AI Interviewer screen; otherwise show the recruiter dashboard) and <strong>navigation state</strong> (tracking which page the recruiter is viewing).</p>

        <h3>5.2 — SetupInterview.tsx: Create a New Interview</h3>
        <p>The form page recruiters fill in to create a new interview. It collects: Candidate Name, Email, Zoom URL, Job Description, and Resume. When "Start Interview" is clicked:</p>
        <div className="doc-flow-step"><div className="doc-flow-num">1</div><div><strong>Save to Supabase</strong> — form data inserted as a new row with status "Scheduled".</div></div>
        <div className="doc-flow-conn" />
        <div className="doc-flow-step"><div className="doc-flow-num">2</div><div><strong>Call Edge Function</strong> — calls <code>create-recall-bot</code> which dispatches a bot into the meeting.</div></div>
        <div className="doc-flow-conn" />
        <div className="doc-flow-step"><div className="doc-flow-num">3</div><div><strong>Show Result</strong> — green success or red error message confirms the outcome.</div></div>

        <h3>5.3 — ActiveInterviews.tsx: View All Interviews</h3>
        <p>Shows a table of every interview created, sorted newest first. Each row displays the candidate's name, email, date, status badge (Scheduled / In Progress / Completed), and message count. Clicking any row opens the Transcript &amp; Assessment view.</p>

        <h3>5.4 — TranscriptAssessment.tsx: Review &amp; Assess</h3>
        <p>The most information-rich page. Shows the full interview transcript as chat bubbles (AI on left, candidate on right), a "Generate Assessment" button that calls Claude AI, and once generated: an overall recommendation, score bars, detailed score cards with rationale and supporting quotes, and culture fit indicators.</p>

        <h3>5.5 — AgentPage.tsx: The AI Interviewer Screen</h3>
        <p>Not seen by recruiters — this is the screen the Recall.ai bot displays inside the Zoom meeting. It is a 1280×720px dark-themed page showing an animated robot avatar, a pulsing status ring, and a live transcript preview. When loaded, it fetches interview data, connects to OpenAI's Realtime API over WebRTC, and the AI speaks first to greet the candidate.</p>

        <div className="doc-card purple">
          <h4>🎙️ How the Voice Works (Simplified)</h4>
          <p style={{ margin: 0 }}>WebRTC is a browser technology that enables live audio streams. The AgentPage opens a peer-to-peer connection with OpenAI's servers. The bot's microphone audio goes to OpenAI, and OpenAI's voice response comes back as audio and is played through the bot's virtual speaker — which the candidate hears in the Zoom call.</p>
        </div>

        {/* ── Section 6 ── */}
        <h2 id="s6"><span className="doc-snum">6</span> Backend Edge Functions</h2>
        <p>Edge Functions are small programs that run in the cloud — not in the user's browser. They are perfect for tasks that need secret API keys, since those keys never leave the server.</p>

        <h3>6.1 — openai-realtime-token</h3>
        <div className="doc-card"><strong>URL:</strong> <code>GET /functions/v1/openai-realtime-token</code><br/><strong>Purpose:</strong> Issues a short-lived ephemeral key that allows the browser to connect to OpenAI's Realtime API without exposing the main API key.</div>
        <p>The real OpenAI API key is held securely server-side. This function exchanges it for a temporary one-use token the browser can safely use for one session.</p>

        <h3>6.2 — create-recall-bot</h3>
        <div className="doc-card"><strong>URL:</strong> <code>POST /functions/v1/create-recall-bot</code><br/><strong>Purpose:</strong> Sends a Recall.ai bot into the specified video meeting, configured to display the AI Interviewer screen and conduct the interview.</div>
        <p>Receives <code>interviewId</code> and <code>zoomUrl</code>, constructs the Agent Page URL, calls Recall.ai's API to create the bot, then updates the interview record with the bot ID and sets status to "In Progress".</p>

        <h3>6.3 — generate-assessment</h3>
        <div className="doc-card"><strong>URL:</strong> <code>POST /functions/v1/generate-assessment</code><br/><strong>Purpose:</strong> Uses Claude AI (claude-opus-4-5) to analyse the interview transcript and produce a structured hiring scorecard.</div>
        <p>Fetches the interview, formats the transcript as readable text, sends it to Claude with a detailed prompt, parses the JSON response, and saves the assessment back to Supabase. The scorecard includes:</p>
        <pre><code>{`{
  "technicalSkillsMatch":    7,   // Score 1–10
  "technicalSkillsRationale": "Candidate showed strong knowledge of...",
  "technicalSkillsQuote":     "I've worked with React for 4 years...",
  "communicationClarity":     8,
  "depthOfExperience":        6,
  "cultureFitIndicators":     ["Collaborative mindset", "Growth-oriented"],
  "overallRecommendation":    "Strong Yes",
  "recommendationSummary":    "Jane demonstrated exceptional..."
}`}</code></pre>

        <h3>6.4 — recall-transcript-webhook</h3>
        <div className="doc-card"><strong>URL:</strong> <code>POST /functions/v1/recall-transcript-webhook</code><br/><strong>Purpose:</strong> Receives incoming transcript chunks and call-end notifications from Recall.ai as the interview happens.</div>
        <p>This is a <strong>webhook</strong> — a URL that Recall.ai calls when events occur. It handles two events: <strong>transcript chunks</strong> (appends new spoken words to the transcript array in Supabase) and <strong>call-end</strong> (marks the interview status as "Completed").</p>

        {/* ── Section 7 ── */}
        <h2 id="s7"><span className="doc-snum">7</span> The AI Voice Interview — Step by Step</h2>

        {[
          ["Recall.ai bot joins the Zoom meeting", "The bot appears as a participant named 'AI Interviewer'. Its camera shows the AgentPage HTML rendered in a headless (invisible) browser."],
          ["AgentPage loads inside the bot's browser", "The page reads ?interviewId=XXX from the URL and fetches the interview data (candidate name, resume, job description) from Supabase."],
          ["Ephemeral token is fetched", "The page calls openai-realtime-token to get a secure, short-lived key that expires after the session."],
          ["WebRTC connection established", "An RTCPeerConnection is created. The bot's microphone audio track is added. An SDP offer is sent to OpenAI's /v1/realtime/calls endpoint, which responds with the matching answer."],
          ["Session is configured via data channel", "A data channel named 'oai-events' is opened. The app sends a session.update event with the system prompt (resume + job description), enables transcription, and configures voice activity detection (VAD)."],
          ["AI speaks first", "A response.create event triggers the AI to greet the candidate by name and ask its first interview question."],
          ["Conversation continues automatically", "Server-side VAD handles turn-taking. When the candidate stops speaking for 700ms, OpenAI processes the input and the AI formulates and speaks its next response."],
          ["Transcript saved in real time", "Two event types populate the transcript: response.audio_transcript.done (interviewer's words) and conversation.item.input_audio_transcription.completed (candidate's words). Each is saved to Supabase with a 1.5 second debounce."],
          ["Interview ends", "When the meeting ends, Recall.ai sends a webhook to /call-end, which marks the interview as 'Completed' in Supabase."],
        ].map(([title, desc], i) => (
          <div key={i}>
            <div className="doc-flow-step">
              <div className="doc-flow-num">{i + 1}</div>
              <div><strong style={{ display: "block", marginBottom: 2 }}>{title}</strong><span style={{ fontSize: 13, color: "#64748b" }}>{desc}</span></div>
            </div>
            {i < 8 && <div className="doc-flow-conn" />}
          </div>
        ))}

        <h3>OpenAI Realtime API — Key Schema Differences</h3>
        <table>
          <thead><tr><th>Setting</th><th>Old model (gpt-4o-realtime)</th><th>New model (gpt-realtime-2) — used here</th></tr></thead>
          <tbody>
            <tr><td>Transcription config</td><td><code>input_audio_transcription: &#123; model: "whisper-1" &#125;</code></td><td><code>audio.input.transcription: &#123; model: "whisper-1" &#125;</code></td></tr>
            <tr><td>VAD config</td><td><code>turn_detection: &#123; type: "server_vad" &#125;</code></td><td><code>audio.input.turn_detection: &#123; type: "server_vad" &#125;</code></td></tr>
            <tr><td>Output voice</td><td><code>voice: "alloy"</code></td><td><code>audio.output.voice: "marin"</code></td></tr>
            <tr><td>SDP endpoint</td><td><code>POST /v1/realtime?model=...</code></td><td><code>POST /v1/realtime/calls</code></td></tr>
          </tbody>
        </table>

        {/* ── Section 8 ── */}
        <h2 id="s8"><span className="doc-snum">8</span> Deployment &amp; Configuration</h2>
        <h3>Frontend — Netlify</h3>
        <p>The React app deploys to Netlify. The build runs <code>npm run build</code> which uses Vite to compile all code into plain HTML/CSS/JS files in the <code>dist/</code> folder.</p>
        <pre><code>{`# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  VITE_SUPABASE_URL = "https://bvckybdvplsjbjhspbyp.supabase.co"
  VITE_SUPABASE_ANON_KEY = "eyJhbGci..."

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200`}</code></pre>

        <h3>Environment Variables</h3>
        <table>
          <thead><tr><th>Variable</th><th>Where it lives</th><th>Purpose</th></tr></thead>
          <tbody>
            <tr><td><code>VITE_SUPABASE_URL</code></td><td>Netlify build env</td><td>Supabase project URL (public, safe to expose)</td></tr>
            <tr><td><code>VITE_SUPABASE_ANON_KEY</code></td><td>Netlify build env</td><td>Anonymous key for reading/writing (public, safe with RLS)</td></tr>
            <tr><td><code>OPENAI_API_KEY</code></td><td>Supabase Edge Function secrets</td><td>The real OpenAI API key — NEVER in the browser</td></tr>
            <tr><td><code>ANTHROPIC_API_KEY</code></td><td>Supabase Edge Function secrets</td><td>The Anthropic (Claude) API key — NEVER in the browser</td></tr>
            <tr><td><code>RECALL_API_KEY</code></td><td>Supabase Edge Function secrets</td><td>The Recall.ai API key for sending bots to meetings</td></tr>
            <tr><td><code>APP_URL</code></td><td>Supabase Edge Function secrets</td><td>The public Netlify URL, used to build the agent page link</td></tr>
            <tr><td><code>SUPABASE_SERVICE_ROLE_KEY</code></td><td>Supabase Edge Function secrets (auto-injected)</td><td>Privileged key for Edge Functions to bypass RLS when writing data</td></tr>
          </tbody>
        </table>

        {/* ── Section 9 ── */}
        <h2 id="s9"><span className="doc-snum">9</span> Key Bugs Fixed During Development</h2>

        <h3>Bug 1 — Candidate Transcript Not Being Captured</h3>
        <div className="doc-card amber">
          <h4>Symptom</h4><p>Only the AI's side of the conversation appeared. The candidate's spoken words were never saved.</p>
          <h4>Root Cause</h4><p>The <code>session.update</code> event used the old <code>gpt-4o-realtime</code> schema. The new <code>gpt-realtime-2</code> API nests transcription config inside <code>audio.input.transcription</code>. Sending the wrong structure was silently ignored.</p>
          <h4>Fix</h4>
          <pre><code>{`// WRONG (old schema):
session: { input_audio_transcription: { model: "whisper-1" } }

// CORRECT (gpt-realtime-2):
session: {
  type: "realtime",
  audio: {
    input: {
      transcription: { model: "whisper-1" },
      turn_detection: { type: "server_vad" }
    }
  }
}`}</code></pre>
        </div>

        <h3>Bug 2 — Blank White Page on Netlify</h3>
        <div className="doc-card amber">
          <h4>Symptom</h4><p>After deploying to Netlify, the site showed a blank white page. Browser console: <code>Uncaught Error: supabaseUrl is required</code>.</p>
          <h4>Root Cause</h4><p>No <code>netlify.toml</code> at the project root meant Netlify compiled the app without <code>VITE_SUPABASE_URL</code> — so Vite compiled empty strings into the bundle. Also, no <code>_redirects</code> rule caused 404s on page refresh.</p>
          <h4>Fix</h4><p>Created <code>netlify.toml</code> with <code>[build.environment]</code> containing both Supabase variables, and a <code>[[redirects]]</code> rule pointing <code>/*</code> to <code>/index.html</code>.</p>
        </div>

        <h3>Bug 3 — SDP Negotiation Failure with gpt-realtime-2</h3>
        <div className="doc-card amber">
          <h4>Symptom</h4><p>The WebRTC connection to OpenAI failed with an SDP error.</p>
          <h4>Root Cause</h4><p>The old WebRTC path sent the SDP offer to <code>/v1/realtime?model=...</code>. The new <code>gpt-realtime-2</code> GA API requires posting to <code>/v1/realtime/calls</code> with a short-lived ephemeral key from <code>/v1/realtime/client_secrets</code>.</p>
          <h4>Fix</h4><p>Updated the edge function to use the new token endpoint and updated <code>agent.html</code> to post the SDP to <code>/v1/realtime/calls</code>.</p>
        </div>

        {/* ── Section 10 ── */}
        <h2 id="s10"><span className="doc-snum">10</span> Glossary for Non-Technical Readers</h2>
        <table>
          <thead><tr><th>Term</th><th>Plain English Explanation</th></tr></thead>
          <tbody>
            {[
              ["API", "Application Programming Interface — a way for one software program to talk to another. Like a waiter who takes your order to the kitchen and brings back food."],
              ["React", "A tool for building web pages that update dynamically without refreshing, like a news ticker that changes without reloading the whole page."],
              ["TypeScript", "A stricter version of JavaScript (the language that makes websites interactive) that catches mistakes before the code runs."],
              ["Component", "A reusable building block of a web page — like a LEGO brick. A button, a form, or a whole page section can each be a component."],
              ["Database / Supabase", "A structured place to store and retrieve data — like a very powerful, searchable spreadsheet hosted in the cloud."],
              ["Edge Function / Serverless", "A small program that runs in the cloud only when needed — like a vending machine that only uses power when someone uses it."],
              ["WebRTC", "A browser technology that enables direct real-time audio/video communication — it's what makes video calls work in a browser without installing software."],
              ["SDP", "Session Description Protocol — a technical message two computers exchange to set up a voice call, describing supported audio formats and network details."],
              ["Webhook", "A URL that receives notifications from external services. Instead of constantly asking 'any updates?', the service calls your webhook when something happens — like a doorbell vs. constantly knocking."],
              ["VAD (Voice Activity Detection)", "Technology that automatically detects when someone is speaking vs. silent, used to know when the candidate has finished talking so the AI can respond."],
              ["Ephemeral token", "A temporary password that expires quickly (usually after one use or a short time). Used so the browser can connect to an API without storing a permanent secret key."],
              ["JSONB", "A database column type that stores flexible, structured data (like a list of messages) rather than simple text or numbers."],
              ["RLS (Row Level Security)", "Database security rules that control exactly who can see or change which rows of data."],
              ["SPA (Single Page Application)", "A website that loads once and then swaps content dynamically without full page reloads — like a phone app that shows different screens without restarting."],
              ["Recall.ai", "A service that provides programmable bots that can join video calls (Zoom, Google Meet, Teams) and display custom content or capture audio/video."],
              ["Claude AI / Anthropic", "An artificial intelligence assistant that can understand and generate text — used here to read interview transcripts and write evaluation reports."],
              ["Deployment", "The process of taking code from a developer's computer and making it live on the internet for people to use."],
              ["Build", "The process of compiling and packaging source code into optimised files that browsers can efficiently load and run."],
            ].map(([term, def]) => (
              <tr key={term}><td><strong>{term}</strong></td><td>{def}</td></tr>
            ))}
          </tbody>
        </table>

        <hr className="doc-hr" />
        <div style={{ textAlign: "center", padding: "16px 0", color: "#94a3b8", fontSize: 12, fontFamily: "Arial,sans-serif" }}>
          RecruiterAI Documentation · Version 1.0 · June 2026<br />
          Built with React · TypeScript · Supabase · OpenAI Realtime API · Claude AI · Recall.ai · Netlify
        </div>
      </div>
    </>
  );
}
