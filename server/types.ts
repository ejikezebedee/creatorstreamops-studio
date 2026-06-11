export type Verdict = "ready" | "needs-review" | "blocked";
export type PlatformStatus = "draft" | "ready" | "completed" | "cancelled";

export interface BaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorProfile extends BaseRecord {
  creatorName: string;
  niche: string;
  targetAudience: string;
  languages: string[];
  contentGoals: string[];
  postingFrequencyTarget: number;
  brandTone: string;
  allowedTopics: string[];
  blockedTopics: string[];
  platformNotes: string;
  monetizationGoals: string[];
  tiktokShopEnabled: boolean;
}

export interface VideoIdea extends BaseRecord {
  title: string;
  topic: string;
  contentPillar: string;
  targetAudience: string;
  hook: string;
  format:
    | "talking-head"
    | "tutorial"
    | "product demo"
    | "storytime"
    | "skit"
    | "reaction"
    | "educational"
    | "behind-the-scenes"
    | "livestream clip";
  status:
    | "idea"
    | "scripted"
    | "recorded"
    | "edited"
    | "scheduled"
    | "posted"
    | "archived";
  priority: "low" | "medium" | "high";
  notes: string;
  linkedCampaign: string;
}

export interface ScriptRecord extends BaseRecord {
  ideaId: string;
  hook: string;
  openingLine: string;
  mainPoints: string[];
  sceneNotes: string;
  voiceoverText: string;
  onScreenText: string;
  callToAction: string;
  estimatedDuration: number;
  shotList: string[];
  editingNotes: string;
  safetyPolicyNotes: string;
}

export interface CaptionRecord extends BaseRecord {
  ideaId: string;
  captionDraft: string;
  hashtagSet: string[];
  callToAction: string;
  language: string;
  tone: string;
  riskNotes: string[];
  policyChecklistStatus: "pending" | "reviewed" | "needs-review";
  sponsoredCampaign: boolean;
}

export interface CalendarItem extends BaseRecord {
  ideaId: string;
  plannedPostingDate: string;
  platform: string;
  status: "planned" | "scheduled" | "posted" | "missed";
  captionReadiness: boolean;
  scriptReadiness: boolean;
  assetReadiness: boolean;
  reminderNotes: string;
  owner: string;
}

export interface RunOfShowSegment {
  id: string;
  segmentType:
    | "intro"
    | "warm-up"
    | "main topic"
    | "product/demo segment"
    | "Q&A"
    | "audience engagement prompt"
    | "recap"
    | "call-to-action"
    | "outro";
  segmentTitle: string;
  plannedStartMinute: number;
  duration: number;
  talkingPoints: string[];
  visualSceneNotes: string;
  moderatorNotes: string;
}

export interface ModerationChecklist {
  moderatorNames: string[];
  blockedWordsPhrases: string[];
  faqReplies: string[];
  escalationNotes: string;
  rulesToRemindAudience: string[];
  spamHandlingNotes: string;
  safetyNotes: string;
}

export interface TechnicalChecklist {
  cameraChecked: boolean;
  microphoneChecked: boolean;
  lightingChecked: boolean;
  internetChecked: boolean;
  sceneLayoutChecked: boolean;
  overlaysChecked: boolean;
  screenShareChecked: boolean;
  productLinksPrepared: boolean;
  backupDeviceReady: boolean;
  emergencyPauseEndPlan: boolean;
  recordingReplayNote: string;
}

export interface LivePlan extends BaseRecord {
  liveTitle: string;
  topic: string;
  objective: string;
  targetAudience: string;
  dateTime: string;
  estimatedDuration: number;
  runOfShow: RunOfShowSegment[];
  productList: string[];
  guestList: string[];
  talkingPoints: string[];
  questionsToAskAudience: string[];
  callToAction: string;
  moderationPlan: ModerationChecklist;
  technicalChecklist: TechnicalChecklist;
  backupPlan: string;
  status: PlatformStatus;
}

export interface AnalyticsEntry extends BaseRecord {
  title: string;
  entryType: "video" | "live";
  date: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  followsGained: number;
  averageWatchTime: string;
  peakLiveViewers: number;
  liveDuration: number;
  productClicks: number;
  salesNotes: string;
  topQuestions: string[];
  audienceFeedback: string;
  lessonsLearned: string;
  contentPillar: string;
}

export interface GeneratedReport extends BaseRecord {
  reportType:
    | "video-brief"
    | "live-brief"
    | "post-live"
    | "weekly"
    | "campaign";
  title: string;
  markdown: string;
}

export interface AuditEvent extends BaseRecord {
  eventType: string;
  actor: string;
  summary: string;
  entityId?: string;
}

export interface AppData {
  creatorProfiles: CreatorProfile[];
  videoIdeas: VideoIdea[];
  scripts: ScriptRecord[];
  captions: CaptionRecord[];
  calendarItems: CalendarItem[];
  livePlans: LivePlan[];
  analytics: AnalyticsEntry[];
  reports: GeneratedReport[];
  auditLog: AuditEvent[];
}
