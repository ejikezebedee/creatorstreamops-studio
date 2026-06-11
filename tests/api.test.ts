// @vitest-environment node

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../server/index.js";

let base = "";
let cookie = "";
let dataDir = "";
let server: ReturnType<ReturnType<typeof createApp>["listen"]>;

async function request(pathname: string, init: RequestInit = {}) {
  const response = await fetch(`${base}${pathname}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...(init.headers || {}),
    },
  });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  const json = await response.json();
  return { response, json };
}

const moderation = {
  moderatorNames: ["Mina"],
  blockedWordsPhrases: ["spam"],
  faqReplies: ["Use the pinned link for product questions."],
  escalationNotes: "Pause if unsafe comments appear.",
  rulesToRemindAudience: ["Respect others"],
  spamHandlingNotes: "Handle manually in platform controls.",
  safetyNotes: "Planning checklist only.",
};

const technical = {
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
  recordingReplayNote: "Use licensed assets only.",
};

describe("CreatorStreamOps API", () => {
  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.ADMIN_USERNAME = "admin";
    process.env.ADMIN_PASSWORD = "creatorstreamops-demo";
    dataDir = await mkdtemp(path.join(tmpdir(), "creatorstreamops-"));
    process.env.DATA_DIR = dataDir;
    const app = createApp();
    server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    if (typeof address === "object" && address)
      base = `http://127.0.0.1:${address.port}/api`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await rm(dataDir, { recursive: true, force: true });
  });

  it("protects authenticated routes and handles errors safely", async () => {
    const denied = await request("/dashboard");
    expect(denied.response.status).toBe(401);
    expect(JSON.stringify(denied.json)).not.toContain(dataDir);
    const bad = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: "admin", password: "wrong" }),
    });
    expect(bad.response.status).toBe(401);
  });

  it("supports creator workflow, readiness, reports, and audit logging", async () => {
    const login = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username: "admin",
        password: "creatorstreamops-demo",
      }),
    });
    expect(login.response.status).toBe(200);

    const profile = await request("/creatorProfiles", {
      method: "POST",
      body: JSON.stringify({
        creatorName: "Demo Creator",
        niche: "music education",
        targetAudience: "new musicians",
        languages: ["English"],
        contentGoals: ["teach", "sell"],
        postingFrequencyTarget: 5,
        brandTone: "warm expert",
        allowedTopics: ["practice"],
        blockedTopics: ["copyright bypass"],
        platformNotes: "TikTok planning only",
        monetizationGoals: ["TikTok Shop"],
        tiktokShopEnabled: true,
      }),
    });
    expect(profile.response.status).toBe(201);

    const idea = await request("/videoIdeas", {
      method: "POST",
      body: JSON.stringify({
        title: "Three warmups before recording",
        topic: "vocal warmups",
        contentPillar: "education",
        targetAudience: "singers",
        hook: "Stop recording cold vocals",
        format: "tutorial",
        priority: "high",
        linkedCampaign: "June Music Push",
      }),
    });
    expect(idea.response.status).toBe(201);

    const script = await request("/scripts", {
      method: "POST",
      body: JSON.stringify({
        ideaId: idea.json.id,
        hook: "Stop recording cold vocals",
        openingLine: "Try these three warmups first.",
        mainPoints: ["lip trills", "sirens", "soft scales"],
        sceneNotes: "Close framing",
        voiceoverText: "Original spoken guidance only.",
        onScreenText: "Warm up before recording",
        callToAction: "Save this before your next session.",
        estimatedDuration: 45,
        shotList: ["face camera", "keyboard"],
        editingNotes: "Cut on beats",
        safetyPolicyNotes: "No copyrighted lyrics.",
      }),
    });
    expect(script.response.status).toBe(201);

    const caption = await request("/captions", {
      method: "POST",
      body: JSON.stringify({
        ideaId: idea.json.id,
        captionDraft: "Three original warmups for better practice. #ad",
        hashtagSet: ["#singingtips", "#musiccreator"],
        callToAction: "Save this routine.",
        language: "English",
        tone: "helpful",
        riskNotes: [],
        policyChecklistStatus: "reviewed",
        sponsoredCampaign: true,
      }),
    });
    expect(caption.json.riskNotes).toEqual([]);

    await request("/calendarItems", {
      method: "POST",
      body: JSON.stringify({
        ideaId: idea.json.id,
        plannedPostingDate: "2026-06-12",
        platform: "TikTok",
        status: "scheduled",
        captionReadiness: true,
        scriptReadiness: true,
        assetReadiness: true,
        owner: "Demo Creator",
      }),
    });

    const videoReady = await request(`/readiness/video/${idea.json.id}`);
    expect(videoReady.json.verdict).toBe("ready");

    const live = await request("/livePlans", {
      method: "POST",
      body: JSON.stringify({
        liveTitle: "Friday Vocal Clinic",
        topic: "performance prep",
        objective: "Teach and sell warmup guide",
        targetAudience: "singers",
        dateTime: "2026-06-12T18:00",
        estimatedDuration: 60,
        runOfShow: [],
        productList: ["Warmup guide"],
        guestList: [],
        talkingPoints: ["prep", "demo"],
        questionsToAskAudience: ["What song are you practicing?"],
        callToAction: "Open the pinned product.",
        moderationPlan: { ...moderation, moderatorNames: [] },
        technicalChecklist: technical,
        backupPlan: "Switch to audio-only if camera fails.",
        status: "draft",
      }),
    });
    expect(live.response.status).toBe(201);

    const blockedLive = await request(`/readiness/live/${live.json.id}`);
    expect(blockedLive.json.verdict).toBe("blocked");

    const segment = await request(`/livePlans/${live.json.id}/run-of-show`, {
      method: "POST",
      body: JSON.stringify({
        segmentType: "intro",
        segmentTitle: "Welcome and agenda",
        plannedStartMinute: 0,
        duration: 5,
        talkingPoints: ["welcome", "rules"],
        visualSceneNotes: "Main camera",
        moderatorNotes: "Pin product note",
      }),
    });
    expect(segment.json.runOfShow).toHaveLength(1);

    const mod = await request(`/livePlans/${live.json.id}/moderation`, {
      method: "PUT",
      body: JSON.stringify(moderation),
    });
    expect(mod.json.moderationPlan.moderatorNames).toEqual(["Mina"]);

    const liveReady = await request(`/readiness/live/${live.json.id}`);
    expect(liveReady.json.verdict).toBe("ready");

    const analytics = await request("/analytics", {
      method: "POST",
      body: JSON.stringify({
        title: "Friday Vocal Clinic",
        entryType: "live",
        date: "2026-06-12",
        views: 1200,
        likes: 140,
        comments: 24,
        shares: 12,
        saves: 19,
        followsGained: 42,
        averageWatchTime: "1m 10s",
        peakLiveViewers: 88,
        liveDuration: 60,
        productClicks: 31,
        salesNotes: "Guide interest was strong.",
        topQuestions: ["How long should warmups take?"],
        audienceFeedback: "Clear demo helped.",
        lessonsLearned: "Start product demo earlier.",
        contentPillar: "education",
      }),
    });
    expect(analytics.response.status).toBe(201);

    const postLive = await request(`/reports/post-live/${live.json.id}`, {
      method: "POST",
    });
    expect(postLive.json.markdown).toContain("Post-LIVE Report");

    const campaign = await request("/reports/campaign", {
      method: "POST",
      body: JSON.stringify({ campaignName: "June Music Push" }),
    });
    expect(campaign.json.markdown).toContain("Campaign Report");

    const weekly = await request("/reports/weekly", { method: "POST" });
    expect(weekly.json.markdown).toContain("Weekly CreatorOps Report");

    const audit = await request("/auditLog");
    expect(
      audit.json.some(
        (event: { eventType: string }) =>
          event.eventType === "report generated",
      ),
    ).toBe(true);
  });
});
