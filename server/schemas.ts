import { z } from "zod";

const list = z.array(z.string()).default([]);
const nonEmpty = z.string().trim().min(1).max(2000);

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const creatorProfileSchema = z.object({
  creatorName: nonEmpty,
  niche: nonEmpty,
  targetAudience: nonEmpty,
  languages: list,
  contentGoals: list,
  postingFrequencyTarget: z.coerce.number().int().min(1).max(28),
  brandTone: nonEmpty,
  allowedTopics: list,
  blockedTopics: list,
  platformNotes: z.string().default(""),
  monetizationGoals: list,
  tiktokShopEnabled: z.boolean().default(false),
});

export const videoIdeaSchema = z.object({
  title: nonEmpty,
  topic: nonEmpty,
  contentPillar: nonEmpty,
  targetAudience: nonEmpty,
  hook: nonEmpty,
  format: z.enum([
    "talking-head",
    "tutorial",
    "product demo",
    "storytime",
    "skit",
    "reaction",
    "educational",
    "behind-the-scenes",
    "livestream clip",
  ]),
  status: z
    .enum([
      "idea",
      "scripted",
      "recorded",
      "edited",
      "scheduled",
      "posted",
      "archived",
    ])
    .default("idea"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  notes: z.string().default(""),
  linkedCampaign: z.string().default(""),
});

export const scriptSchema = z.object({
  ideaId: nonEmpty,
  hook: nonEmpty,
  openingLine: nonEmpty,
  mainPoints: list,
  sceneNotes: z.string().default(""),
  voiceoverText: z.string().default(""),
  onScreenText: z.string().default(""),
  callToAction: nonEmpty,
  estimatedDuration: z.coerce.number().int().min(5).max(600),
  shotList: list,
  editingNotes: z.string().default(""),
  safetyPolicyNotes: z.string().default(""),
});

export const captionSchema = z.object({
  ideaId: nonEmpty,
  captionDraft: nonEmpty,
  hashtagSet: list,
  callToAction: nonEmpty,
  language: z.string().default("English"),
  tone: z.string().default("clear"),
  riskNotes: list,
  policyChecklistStatus: z
    .enum(["pending", "reviewed", "needs-review"])
    .default("pending"),
  sponsoredCampaign: z.boolean().default(false),
});

export const calendarSchema = z.object({
  ideaId: nonEmpty,
  plannedPostingDate: nonEmpty,
  platform: z.string().default("TikTok"),
  status: z
    .enum(["planned", "scheduled", "posted", "missed"])
    .default("planned"),
  captionReadiness: z.boolean().default(false),
  scriptReadiness: z.boolean().default(false),
  assetReadiness: z.boolean().default(false),
  reminderNotes: z.string().default(""),
  owner: z.string().default("Creator"),
});

export const segmentSchema = z.object({
  segmentType: z.enum([
    "intro",
    "warm-up",
    "main topic",
    "product/demo segment",
    "Q&A",
    "audience engagement prompt",
    "recap",
    "call-to-action",
    "outro",
  ]),
  segmentTitle: nonEmpty,
  plannedStartMinute: z.coerce.number().int().min(0).max(1440),
  duration: z.coerce.number().int().min(1).max(240),
  talkingPoints: list,
  visualSceneNotes: z.string().default(""),
  moderatorNotes: z.string().default(""),
});

export const moderationSchema = z.object({
  moderatorNames: list,
  blockedWordsPhrases: list,
  faqReplies: list,
  escalationNotes: z.string().default(""),
  rulesToRemindAudience: list,
  spamHandlingNotes: z.string().default(""),
  safetyNotes: z.string().default(""),
});

export const technicalSchema = z.object({
  cameraChecked: z.boolean().default(false),
  microphoneChecked: z.boolean().default(false),
  lightingChecked: z.boolean().default(false),
  internetChecked: z.boolean().default(false),
  sceneLayoutChecked: z.boolean().default(false),
  overlaysChecked: z.boolean().default(false),
  screenShareChecked: z.boolean().default(false),
  productLinksPrepared: z.boolean().default(false),
  backupDeviceReady: z.boolean().default(false),
  emergencyPauseEndPlan: z.boolean().default(false),
  recordingReplayNote: z.string().default(""),
});

export const livePlanSchema = z.object({
  liveTitle: nonEmpty,
  topic: nonEmpty,
  objective: nonEmpty,
  targetAudience: nonEmpty,
  dateTime: nonEmpty,
  estimatedDuration: z.coerce.number().int().min(5).max(1440),
  runOfShow: z.array(segmentSchema).default([]),
  productList: list,
  guestList: list,
  talkingPoints: list,
  questionsToAskAudience: list,
  callToAction: nonEmpty,
  moderationPlan: moderationSchema,
  technicalChecklist: technicalSchema,
  backupPlan: z.string().default(""),
  status: z.enum(["draft", "ready", "completed", "cancelled"]).default("draft"),
});

export const analyticsSchema = z.object({
  title: nonEmpty,
  entryType: z.enum(["video", "live"]),
  date: nonEmpty,
  views: z.coerce.number().int().min(0).default(0),
  likes: z.coerce.number().int().min(0).default(0),
  comments: z.coerce.number().int().min(0).default(0),
  shares: z.coerce.number().int().min(0).default(0),
  saves: z.coerce.number().int().min(0).default(0),
  followsGained: z.coerce.number().int().min(0).default(0),
  averageWatchTime: z.string().default(""),
  peakLiveViewers: z.coerce.number().int().min(0).default(0),
  liveDuration: z.coerce.number().int().min(0).default(0),
  productClicks: z.coerce.number().int().min(0).default(0),
  salesNotes: z.string().default(""),
  topQuestions: list,
  audienceFeedback: z.string().default(""),
  lessonsLearned: z.string().default(""),
  contentPillar: z.string().default("general"),
});
