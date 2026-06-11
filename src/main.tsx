import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Hash,
  LayoutDashboard,
  ListChecks,
  Lock,
  LogOut,
  Mic2,
  PenLine,
  Radio,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Video,
} from "lucide-react";
import "./styles.css";

type ViewKey =
  | "overview"
  | "ideas"
  | "scripts"
  | "captions"
  | "calendar"
  | "live"
  | "runshow"
  | "moderation"
  | "shop"
  | "analytics"
  | "postlive"
  | "campaign"
  | "settings"
  | "audit";

const views: { key: ViewKey; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "ideas", label: "Idea Bank", icon: Sparkles },
  { key: "scripts", label: "Script Builder", icon: PenLine },
  { key: "captions", label: "Captions", icon: Hash },
  { key: "calendar", label: "Calendar", icon: CalendarDays },
  { key: "live", label: "LIVE Planner", icon: Radio },
  { key: "runshow", label: "Run Of Show", icon: Mic2 },
  { key: "moderation", label: "Moderation", icon: ShieldCheck },
  { key: "shop", label: "Shop Planner", icon: ShoppingBag },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "postlive", label: "Post-LIVE", icon: FileText },
  { key: "campaign", label: "Campaign", icon: ClipboardCheck },
  { key: "settings", label: "Settings", icon: Settings },
  { key: "audit", label: "Audit Log", icon: ScrollText },
];

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (!response.ok)
    throw new Error((await response.json()).error || "Request failed");
  return response.json();
}

function textList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function useStudioData(authed: boolean) {
  const [data, setData] = useState<Record<string, any>>({});
  const refresh = async () => {
    if (!authed) return;
    const [
      dashboard,
      ideas,
      scripts,
      captions,
      calendar,
      livePlans,
      analytics,
      reports,
      auditLog,
    ] = await Promise.all([
      api("/dashboard"),
      api("/videoIdeas"),
      api("/scripts"),
      api("/captions"),
      api("/calendarItems"),
      api("/livePlans"),
      api("/analytics"),
      api("/reports"),
      api("/auditLog"),
    ]);
    setData({
      dashboard,
      ideas,
      scripts,
      captions,
      calendar,
      livePlans,
      analytics,
      reports,
      auditLog,
    });
  };
  useEffect(() => {
    refresh().catch(() => undefined);
  }, [authed]);
  return { data, refresh };
}

export function Login({ onLogin }: { onLogin: () => void }) {
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
        }),
      });
      onLogin();
    } catch (err) {
      setError((err as Error).message);
    }
  };
  return (
    <main className="loginShell">
      <section className="loginPanel">
        <div className="brandMark">
          <Video />
        </div>
        <h1>CreatorStreamOps Studio</h1>
        <p>
          Local creator operations for TikTok videos, LIVE planning, manual
          analytics, moderation prep, and reporting.
        </p>
        <form onSubmit={submit}>
          <label>
            Username
            <input name="username" defaultValue="admin" />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              defaultValue="creatorstreamops-demo"
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="primary" type="submit">
            <Lock size={16} /> Unlock Local Studio
          </button>
        </form>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  tone = "ink",
}: {
  label: string;
  value: React.ReactNode;
  tone?: string;
}) {
  return (
    <article className={`metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Overview({ data }: { data: any }) {
  const d = data.dashboard || {};
  return (
    <section className="workspace">
      <div className="pageHead">
        <div>
          <p className="eyebrow">Creator command desk</p>
          <h2>Operational Overview</h2>
        </div>
        <span className={`verdict ${d.campaignReadinessVerdict || "blocked"}`}>
          {d.campaignReadinessVerdict || "blocked"}
        </span>
      </div>
      <div className="metricsGrid">
        <Metric label="Planned Videos" value={d.totalPlannedVideos || 0} />
        <Metric
          label="Scheduled Videos"
          value={d.scheduledVideos || 0}
          tone="amber"
        />
        <Metric label="Drafted Scripts" value={d.draftedScripts || 0} />
        <Metric
          label="Upcoming LIVE"
          value={d.upcomingLiveSessions || 0}
          tone="green"
        />
        <Metric label="Completed LIVE" value={d.completedLiveSessions || 0} />
        <Metric
          label="Open Moderation Tasks"
          value={d.openModerationTasks || 0}
          tone="red"
        />
        <Metric
          label="Missing Captions/Scripts"
          value={d.missingCaptionsScripts || 0}
          tone="amber"
        />
        <Metric
          label="Weekly Consistency"
          value={`${d.weeklyConsistencyScore || 0}%`}
          tone="green"
        />
      </div>
      <div className="split">
        <Panel title="Top Performing Content">
          {(d.topPerformingContent || []).length ? (
            d.topPerformingContent.map((item: any) => (
              <Row
                key={item.id}
                title={item.title}
                detail={`${item.views} views • ${item.followsGained} follows`}
              />
            ))
          ) : (
            <Empty text="No manual analytics entered yet." />
          )}
        </Panel>
        <Panel title="Platform Boundary">
          <ul className="checkList">
            <li>
              No artificial engagement, fake audience growth, gift manipulation,
              or synthetic viewing tools.
            </li>
            <li>No scraping or hidden browser automation.</li>
            <li>
              Manual planning, checklists, reports, and official API-ready
              placeholders only.
            </li>
          </ul>
        </Panel>
      </div>
    </section>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function Row({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="row">
      <b>{title}</b>
      <span>{detail}</span>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="empty">{text}</p>;
}

function IdeaForm({ refresh }: { refresh: () => Promise<void> }) {
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/videoIdeas", {
      method: "POST",
      body: JSON.stringify({
        title: form.get("title"),
        topic: form.get("topic"),
        contentPillar: form.get("pillar"),
        targetAudience: form.get("audience"),
        hook: form.get("hook"),
        format: form.get("format"),
        status: "idea",
        priority: form.get("priority"),
        notes: form.get("notes"),
        linkedCampaign: form.get("campaign"),
      }),
    });
    event.currentTarget.reset();
    await refresh();
  };
  return (
    <form className="formGrid" onSubmit={submit}>
      <input name="title" placeholder="Idea title" required />
      <input name="topic" placeholder="Topic" required />
      <input name="pillar" placeholder="Content pillar" required />
      <input name="audience" placeholder="Target audience" required />
      <input name="hook" placeholder="Hook" required />
      <select name="format" defaultValue="tutorial">
        {[
          "talking-head",
          "tutorial",
          "product demo",
          "storytime",
          "skit",
          "reaction",
          "educational",
          "behind-the-scenes",
          "livestream clip",
        ].map((format) => (
          <option key={format}>{format}</option>
        ))}
      </select>
      <select name="priority" defaultValue="medium">
        <option>low</option>
        <option>medium</option>
        <option>high</option>
      </select>
      <input name="campaign" placeholder="Linked campaign" />
      <textarea name="notes" placeholder="Notes" />
      <button className="primary">Add Idea</button>
    </form>
  );
}

function Ideas({ data, refresh }: { data: any; refresh: () => Promise<void> }) {
  return (
    <section className="workspace">
      <PageTitle
        title="Video Idea Bank"
        subtitle="Organize hooks, formats, pillars, priorities, and campaigns."
      />
      <IdeaForm refresh={refresh} />
      <GridList
        items={data.ideas || []}
        render={(item) => (
          <Row
            title={item.title}
            detail={`${item.format} • ${item.contentPillar} • ${item.priority}`}
          />
        )}
      />
    </section>
  );
}

function ScriptBuilder({
  data,
  refresh,
}: {
  data: any;
  refresh: () => Promise<void>;
}) {
  const ideas = data.ideas || [];
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/scripts", {
      method: "POST",
      body: JSON.stringify({
        ideaId: form.get("ideaId"),
        hook: form.get("hook"),
        openingLine: form.get("openingLine"),
        mainPoints: textList(String(form.get("mainPoints") || "")),
        sceneNotes: form.get("sceneNotes"),
        voiceoverText: form.get("voiceoverText"),
        onScreenText: form.get("onScreenText"),
        callToAction: form.get("callToAction"),
        estimatedDuration: Number(form.get("duration")),
        shotList: textList(String(form.get("shotList") || "")),
        editingNotes: form.get("editingNotes"),
        safetyPolicyNotes: form.get("safety"),
      }),
    });
    event.currentTarget.reset();
    await refresh();
  };
  return (
    <section className="workspace">
      <PageTitle
        title="Script Builder"
        subtitle="Structured hooks, shot lists, on-screen text, CTA, and safety notes."
      />
      <form className="formGrid" onSubmit={submit}>
        <select name="ideaId" required>
          {ideas.map((idea: any) => (
            <option key={idea.id} value={idea.id}>
              {idea.title}
            </option>
          ))}
        </select>
        <input name="hook" placeholder="Hook" required />
        <input name="openingLine" placeholder="Opening line" required />
        <textarea name="mainPoints" placeholder="Main points, one per line" />
        <textarea name="shotList" placeholder="Shot list, one per line" />
        <input name="callToAction" placeholder="Call to action" required />
        <input name="duration" type="number" defaultValue="45" />
        <textarea name="sceneNotes" placeholder="Scene notes" />
        <textarea name="voiceoverText" placeholder="Voiceover text" />
        <textarea name="onScreenText" placeholder="On-screen text" />
        <textarea name="editingNotes" placeholder="Editing notes" />
        <textarea name="safety" placeholder="Safety/policy notes" />
        <button className="primary">Save Script</button>
      </form>
      <GridList
        items={data.scripts || []}
        render={(item) => (
          <Row
            title={item.hook}
            detail={`${item.estimatedDuration}s • ${item.callToAction}`}
          />
        )}
      />
    </section>
  );
}

function Captions({
  data,
  refresh,
}: {
  data: any;
  refresh: () => Promise<void>;
}) {
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/captions", {
      method: "POST",
      body: JSON.stringify({
        ideaId: form.get("ideaId"),
        captionDraft: form.get("caption"),
        hashtagSet: textList(String(form.get("hashtags") || "")),
        callToAction: form.get("cta"),
        language: form.get("language"),
        tone: form.get("tone"),
        riskNotes: [],
        policyChecklistStatus: form.get("policy"),
        sponsoredCampaign: form.get("sponsored") === "on",
      }),
    });
    event.currentTarget.reset();
    await refresh();
  };
  return (
    <section className="workspace">
      <PageTitle
        title="Caption And Hashtag Workspace"
        subtitle="Draft captions and run a basic text risk checklist for human review."
      />
      <form className="formGrid" onSubmit={submit}>
        <select name="ideaId">
          {(data.ideas || []).map((idea: any) => (
            <option key={idea.id} value={idea.id}>
              {idea.title}
            </option>
          ))}
        </select>
        <textarea name="caption" placeholder="Caption draft" required />
        <textarea name="hashtags" placeholder="#hashtags, one per line" />
        <input name="cta" placeholder="CTA" required />
        <input name="language" defaultValue="English" />
        <input name="tone" defaultValue="clear" />
        <select name="policy" defaultValue="reviewed">
          <option>pending</option>
          <option>reviewed</option>
          <option>needs-review</option>
        </select>
        <label className="inline">
          <input type="checkbox" name="sponsored" /> Sponsored campaign
        </label>
        <button className="primary">Save Caption</button>
      </form>
      <GridList
        items={data.captions || []}
        render={(item) => (
          <Row
            title={item.captionDraft}
            detail={`${item.policyChecklistStatus} • ${item.riskNotes.join(", ") || "no flags"}`}
          />
        )}
      />
    </section>
  );
}

function CalendarView({
  data,
  refresh,
}: {
  data: any;
  refresh: () => Promise<void>;
}) {
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/calendarItems", {
      method: "POST",
      body: JSON.stringify({
        ideaId: form.get("ideaId"),
        plannedPostingDate: form.get("date"),
        platform: "TikTok",
        status: form.get("status"),
        captionReadiness: form.get("caption") === "on",
        scriptReadiness: form.get("script") === "on",
        assetReadiness: form.get("asset") === "on",
        reminderNotes: form.get("notes"),
        owner: form.get("owner"),
      }),
    });
    event.currentTarget.reset();
    await refresh();
  };
  return (
    <section className="workspace">
      <PageTitle
        title="Content Calendar"
        subtitle="Schedule videos with owner, readiness, reminders, and platform status."
      />
      <form className="formGrid" onSubmit={submit}>
        <select name="ideaId">
          {(data.ideas || []).map((idea: any) => (
            <option key={idea.id} value={idea.id}>
              {idea.title}
            </option>
          ))}
        </select>
        <input type="date" name="date" required />
        <select name="status">
          <option>planned</option>
          <option>scheduled</option>
          <option>posted</option>
          <option>missed</option>
        </select>
        <input name="owner" placeholder="Owner" defaultValue="Creator" />
        <label className="inline">
          <input name="caption" type="checkbox" /> Caption ready
        </label>
        <label className="inline">
          <input name="script" type="checkbox" /> Script ready
        </label>
        <label className="inline">
          <input name="asset" type="checkbox" /> Assets ready
        </label>
        <textarea name="notes" placeholder="Reminder notes" />
        <button className="primary">Schedule</button>
      </form>
      <GridList
        items={data.calendar || []}
        render={(item) => (
          <Row
            title={item.plannedPostingDate}
            detail={`${item.status} • ${item.owner}`}
          />
        )}
      />
    </section>
  );
}

const defaultModeration = {
  moderatorNames: ["Lead moderator"],
  blockedWordsPhrases: ["spam phrase"],
  faqReplies: ["Shipping details are in the pinned product notes."],
  escalationNotes: "Pause the LIVE and escalate if safety issues appear.",
  rulesToRemindAudience: ["Keep comments respectful.", "No spam."],
  spamHandlingNotes: "Remove repeated spam manually through platform controls.",
  safetyNotes: "Planning checklist only. No auto-moderation bot.",
};

const completeTech = {
  cameraChecked: true,
  microphoneChecked: true,
  lightingChecked: true,
  internetChecked: true,
  sceneLayoutChecked: true,
  overlaysChecked: true,
  screenShareChecked: true,
  productLinksPrepared: true,
  backupDeviceReady: true,
  emergencyPauseEndPlan: true,
  recordingReplayNote: "Record only owned or licensed content.",
};

function LivePlanner({
  data,
  refresh,
}: {
  data: any;
  refresh: () => Promise<void>;
}) {
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/livePlans", {
      method: "POST",
      body: JSON.stringify({
        liveTitle: form.get("title"),
        topic: form.get("topic"),
        objective: form.get("objective"),
        targetAudience: form.get("audience"),
        dateTime: form.get("dateTime"),
        estimatedDuration: Number(form.get("duration")),
        runOfShow: [],
        productList: textList(String(form.get("products") || "")),
        guestList: textList(String(form.get("guests") || "")),
        talkingPoints: textList(String(form.get("points") || "")),
        questionsToAskAudience: textList(String(form.get("questions") || "")),
        callToAction: form.get("cta"),
        moderationPlan: defaultModeration,
        technicalChecklist: completeTech,
        backupPlan: form.get("backup"),
        status: "draft",
      }),
    });
    event.currentTarget.reset();
    await refresh();
  };
  return (
    <section className="workspace">
      <PageTitle
        title="Livestream Planner"
        subtitle="Plan LIVE title, objective, products, guests, talking points, CTA, and backup plan."
      />
      <form className="formGrid" onSubmit={submit}>
        <input name="title" placeholder="LIVE title" required />
        <input name="topic" placeholder="Topic" required />
        <input name="objective" placeholder="Objective" required />
        <input name="audience" placeholder="Target audience" required />
        <input type="datetime-local" name="dateTime" required />
        <input type="number" name="duration" defaultValue="60" />
        <textarea name="products" placeholder="Product list, one per line" />
        <textarea name="guests" placeholder="Guest list, one per line" />
        <textarea name="points" placeholder="Talking points, one per line" />
        <textarea
          name="questions"
          placeholder="Questions for audience, one per line"
        />
        <input name="cta" placeholder="Call to action" required />
        <textarea name="backup" placeholder="Backup plan" required />
        <button className="primary">Create LIVE Plan</button>
      </form>
      <GridList
        items={data.livePlans || []}
        render={(item) => (
          <Row
            title={item.liveTitle}
            detail={`${item.status} • ${item.estimatedDuration} minutes • ${item.productList.length} products`}
          />
        )}
      />
    </section>
  );
}

function RunShow({
  data,
  refresh,
}: {
  data: any;
  refresh: () => Promise<void>;
}) {
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api(`/livePlans/${form.get("liveId")}/run-of-show`, {
      method: "POST",
      body: JSON.stringify({
        segmentType: form.get("type"),
        segmentTitle: form.get("title"),
        plannedStartMinute: Number(form.get("start")),
        duration: Number(form.get("duration")),
        talkingPoints: textList(String(form.get("points") || "")),
        visualSceneNotes: form.get("visual"),
        moderatorNotes: form.get("moderator"),
      }),
    });
    event.currentTarget.reset();
    await refresh();
  };
  return (
    <section className="workspace">
      <PageTitle
        title="Run-Of-Show Builder"
        subtitle="Build timed segments for intros, demos, Q&A, prompts, recap, CTA, and outro."
      />
      <form className="formGrid" onSubmit={submit}>
        <select name="liveId">
          {(data.livePlans || []).map((live: any) => (
            <option key={live.id} value={live.id}>
              {live.liveTitle}
            </option>
          ))}
        </select>
        <select name="type">
          {[
            "intro",
            "warm-up",
            "main topic",
            "product/demo segment",
            "Q&A",
            "audience engagement prompt",
            "recap",
            "call-to-action",
            "outro",
          ].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <input name="title" placeholder="Segment title" required />
        <input name="start" type="number" defaultValue="0" />
        <input name="duration" type="number" defaultValue="10" />
        <textarea name="points" placeholder="Talking points, one per line" />
        <textarea name="visual" placeholder="Visual/scene notes" />
        <textarea name="moderator" placeholder="Moderator notes" />
        <button className="primary">Add Segment</button>
      </form>
      {(data.livePlans || []).map((live: any) => (
        <Panel key={live.id} title={live.liveTitle}>
          {live.runOfShow.map((seg: any) => (
            <Row
              key={seg.id}
              title={seg.segmentTitle}
              detail={`${seg.plannedStartMinute}m • ${seg.duration}m • ${seg.segmentType}`}
            />
          ))}
        </Panel>
      ))}
    </section>
  );
}

function Moderation({
  data,
  refresh,
}: {
  data: any;
  refresh: () => Promise<void>;
}) {
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api(`/livePlans/${form.get("liveId")}/moderation`, {
      method: "PUT",
      body: JSON.stringify({
        moderatorNames: textList(String(form.get("moderators") || "")),
        blockedWordsPhrases: textList(String(form.get("blocked") || "")),
        faqReplies: textList(String(form.get("faq") || "")),
        escalationNotes: form.get("escalation"),
        rulesToRemindAudience: textList(String(form.get("rules") || "")),
        spamHandlingNotes: form.get("spam"),
        safetyNotes: form.get("safety"),
      }),
    });
    await refresh();
  };
  return (
    <section className="workspace">
      <PageTitle
        title="Moderation Checklist"
        subtitle="Prepare human moderator names, blocked phrases, FAQ replies, rules, escalation, and safety notes."
      />
      <form className="formGrid" onSubmit={submit}>
        <select name="liveId">
          {(data.livePlans || []).map((live: any) => (
            <option key={live.id} value={live.id}>
              {live.liveTitle}
            </option>
          ))}
        </select>
        <textarea
          name="moderators"
          placeholder="Moderator names, one per line"
        />
        <textarea
          name="blocked"
          placeholder="Blocked words/phrases, one per line"
        />
        <textarea name="faq" placeholder="FAQ replies, one per line" />
        <textarea
          name="rules"
          placeholder="Rules to remind audience, one per line"
        />
        <textarea name="escalation" placeholder="Escalation notes" />
        <textarea name="spam" placeholder="Spam handling notes" />
        <textarea name="safety" placeholder="Safety notes" />
        <button className="primary">Update Checklist</button>
      </form>
      <Panel title="OBS / TikTok LIVE Studio Checklist">
        <ul className="checkList">
          {Object.keys(completeTech).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Panel>
    </section>
  );
}

function Analytics({ refresh }: { refresh: () => Promise<void> }) {
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/analytics", {
      method: "POST",
      body: JSON.stringify({
        title: form.get("title"),
        entryType: form.get("type"),
        date: form.get("date"),
        views: Number(form.get("views")),
        likes: Number(form.get("likes")),
        comments: Number(form.get("comments")),
        shares: Number(form.get("shares")),
        saves: Number(form.get("saves")),
        followsGained: Number(form.get("follows")),
        averageWatchTime: form.get("watch"),
        peakLiveViewers: Number(form.get("peak")),
        liveDuration: Number(form.get("duration")),
        productClicks: Number(form.get("clicks")),
        salesNotes: form.get("sales"),
        topQuestions: textList(String(form.get("questions") || "")),
        audienceFeedback: form.get("feedback"),
        lessonsLearned: form.get("lessons"),
        contentPillar: form.get("pillar"),
      }),
    });
    event.currentTarget.reset();
    await refresh();
  };
  return (
    <section className="workspace">
      <PageTitle
        title="Manual Analytics Tracker"
        subtitle="No scraping. Enter views, comments, watch time, LIVE metrics, questions, feedback, and lessons manually."
      />
      <form className="formGrid" onSubmit={submit}>
        <input name="title" placeholder="Video/LIVE title" required />
        <select name="type">
          <option>video</option>
          <option>live</option>
        </select>
        <input type="date" name="date" required />
        {[
          "views",
          "likes",
          "comments",
          "shares",
          "saves",
          "follows",
          "peak",
          "duration",
          "clicks",
        ].map((name) => (
          <input
            key={name}
            name={name}
            type="number"
            defaultValue="0"
            placeholder={name}
          />
        ))}
        <input name="watch" placeholder="Average watch time" />
        <input name="pillar" placeholder="Content pillar" />
        <textarea name="questions" placeholder="Top questions, one per line" />
        <textarea name="feedback" placeholder="Audience feedback" />
        <textarea name="lessons" placeholder="Lessons learned" />
        <textarea name="sales" placeholder="Sales notes" />
        <button className="primary">Add Analytics</button>
      </form>
    </section>
  );
}

function Reports({
  data,
  refresh,
  type,
}: {
  data: any;
  refresh: () => Promise<void>;
  type: "postlive" | "campaign";
}) {
  const generate = async () => {
    if (type === "campaign") {
      await api("/reports/campaign", {
        method: "POST",
        body: JSON.stringify({
          campaignName: data.ideas?.[0]?.linkedCampaign || "Creator Campaign",
        }),
      });
    } else if (data.livePlans?.[0]) {
      await api(`/reports/post-live/${data.livePlans[0].id}`, {
        method: "POST",
      });
    }
    await refresh();
  };
  return (
    <section className="workspace">
      <PageTitle
        title={
          type === "campaign" ? "Campaign Report Page" : "Post-LIVE Report Page"
        }
        subtitle="Generate Markdown reports from local planning and manual analytics records."
      />
      <button className="primary" onClick={generate}>
        <FileText size={16} /> Generate Report
      </button>
      <GridList
        items={data.reports || []}
        render={(item) => (
          <Row
            title={item.title}
            detail={`${item.reportType} • ${item.markdown.length} chars`}
          />
        )}
      />
    </section>
  );
}

function GenericPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="workspace">
      <PageTitle title={title} subtitle={subtitle} />
      {children || (
        <Panel title="Workspace">
          <Empty text="Use the related creator records to prepare this module." />
        </Panel>
      )}
    </section>
  );
}

function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="pageHead">
      <div>
        <p className="eyebrow">CreatorStreamOps</p>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function GridList({
  items,
  render,
}: {
  items: any[];
  render: (item: any) => React.ReactNode;
}) {
  return (
    <div className="gridList">
      {items.length ? (
        items.map((item) => (
          <article className="listCard" key={item.id}>
            {render(item)}
          </article>
        ))
      ) : (
        <Empty text="No records yet." />
      )}
    </div>
  );
}

export function App() {
  const [authed, setAuthed] = useState(false);
  const [view, setView] = useState<ViewKey>("overview");
  const { data, refresh } = useStudioData(authed);
  const active = useMemo(() => views.find((item) => item.key === view), [view]);

  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

  const logout = async () => {
    await api("/auth/logout", { method: "POST" });
    setAuthed(false);
  };

  return (
    <main className="appShell">
      <aside className="sidebar">
        <div className="brand">
          <Video />
          <b>CreatorStreamOps</b>
        </div>
        <nav>
          {views.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className={view === item.key ? "active" : ""}
                onClick={() => setView(item.key)}
                title={item.label}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <button className="logout" onClick={logout}>
          <LogOut size={16} /> Logout
        </button>
      </aside>
      <section className="mainPane">
        <header className="topbar">
          <span>{active?.label}</span>
          <b>Local-first creator operations</b>
        </header>
        {view === "overview" && <Overview data={data} />}
        {view === "ideas" && <Ideas data={data} refresh={refresh} />}
        {view === "scripts" && <ScriptBuilder data={data} refresh={refresh} />}
        {view === "captions" && <Captions data={data} refresh={refresh} />}
        {view === "calendar" && <CalendarView data={data} refresh={refresh} />}
        {view === "live" && <LivePlanner data={data} refresh={refresh} />}
        {view === "runshow" && <RunShow data={data} refresh={refresh} />}
        {view === "moderation" && <Moderation data={data} refresh={refresh} />}
        {view === "analytics" && <Analytics refresh={refresh} />}
        {view === "postlive" && (
          <Reports data={data} refresh={refresh} type="postlive" />
        )}
        {view === "campaign" && (
          <Reports data={data} refresh={refresh} type="campaign" />
        )}
        {view === "shop" && (
          <GenericPage
            title="TikTok Shop / LIVE Selling Planner"
            subtitle="Plan product lists, demos, selling CTAs, product-click notes, and sales follow-up without posting automation."
          >
            <Panel title="Shop Planning Records">
              {(data.livePlans || []).map((item: any) => (
                <Row
                  key={item.id}
                  title={item.liveTitle}
                  detail={`${item.productList.length} products prepared`}
                />
              ))}
            </Panel>
          </GenericPage>
        )}
        {view === "settings" && (
          <GenericPage
            title="Settings"
            subtitle="Demo local admin defaults are documented. Replace credentials before real use."
          >
            <Panel title="Creator Profile API">
              <p className="empty">
                Use `/api/creatorProfiles` for local creator profile setup. Demo
                password is for local testing only.
              </p>
            </Panel>
          </GenericPage>
        )}
        {view === "audit" && (
          <GenericPage
            title="Audit Log"
            subtitle="Creator profile, content, LIVE, analytics, report, readiness, auth, and system events."
          >
            <GridList
              items={data.auditLog || []}
              render={(item) => (
                <Row title={item.eventType} detail={item.summary} />
              )}
            />
          </GenericPage>
        )}
      </section>
    </main>
  );
}

const root =
  typeof document === "undefined" ? null : document.getElementById("root");
if (root) createRoot(root).render(<App />);
