import express, { type Request, type Response } from "express";
import { v4 as uuid } from "uuid";
import {
  analyticsSchema,
  calendarSchema,
  captionSchema,
  creatorProfileSchema,
  livePlanSchema,
  loginSchema,
  moderationSchema,
  scriptSchema,
  segmentSchema,
  technicalSchema,
  videoIdeaSchema,
} from "./schemas.js";
import {
  createSession,
  destroySession,
  requireAuth,
  safeCookieOptions,
  verifyLogin,
} from "./auth.js";
import { audit, JsonStore, now, withBase } from "./storage.js";
import {
  campaignReadiness,
  consistencyScore,
  liveReadiness,
  videoReadiness,
} from "./readiness.js";
import {
  campaignReport,
  liveProductionBrief,
  postLiveReport,
  videoProductionBrief,
  weeklyCreatorOpsReport,
} from "./reports.js";
import type { CaptionRecord } from "./types.js";

const riskyTerms = {
  unrealistic: ["guaranteed viral", "instant fame", "100% results"],
  regulated: ["cure", "guaranteed profit", "legal guarantee"],
  harassment: ["idiot", "hate them", "attack"],
  adultUnsafe: ["explicit", "nsfw"],
  copyright: ["full lyrics", "entire song", "download copyrighted"],
};

function analyzeCaption(caption: CaptionRecord): CaptionRecord {
  const text =
    `${caption.captionDraft} ${caption.hashtagSet.join(" ")}`.toLowerCase();
  const notes: string[] = [];
  for (const [group, terms] of Object.entries(riskyTerms)) {
    if (terms.some((term) => text.includes(term)))
      notes.push(`${group} wording needs human review`);
  }
  if (
    caption.sponsoredCampaign &&
    !/(#ad|sponsored|paid partnership)/i.test(caption.captionDraft)
  ) {
    notes.push("missing ad/sponsorship disclosure flag");
  }
  return {
    ...caption,
    riskNotes: [...new Set([...caption.riskNotes, ...notes])],
  };
}

export function createRouter(store = new JsonStore()) {
  const router = express.Router();

  router.get("/health", (_req, res) =>
    res.json({
      ok: true,
      service: "CreatorStreamOps Studio",
      mode: "local-first",
    }),
  );

  router.post("/auth/login", async (req, res) => {
    const parsed = loginSchema.parse(req.body);
    if (!(await verifyLogin(parsed.username, parsed.password))) {
      await store.mutate((data) =>
        data.auditLog.push(audit("auth event", "Failed local admin login")),
      );
      return res.status(401).json({ error: "Invalid credentials." });
    }
    const token = createSession(parsed.username);
    await store.mutate((data) =>
      data.auditLog.push(audit("auth event", "Local admin login")),
    );
    res
      .cookie("creatorstreamops_session", token, safeCookieOptions())
      .json({ ok: true });
  });

  router.post("/auth/logout", (req, res) => {
    destroySession(req.cookies?.creatorstreamops_session);
    res
      .clearCookie("creatorstreamops_session", { path: "/" })
      .json({ ok: true });
  });

  router.use(requireAuth);

  router.get("/dashboard", async (_req, res) => {
    const data = await store.read();
    const top = [...data.analytics]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
    res.json({
      totalPlannedVideos: data.videoIdeas.length,
      scheduledVideos: data.calendarItems.filter(
        (item) => item.status === "scheduled" || item.status === "planned",
      ).length,
      draftedScripts: data.scripts.length,
      upcomingLiveSessions: data.livePlans.filter(
        (item) => item.status === "ready" || item.status === "draft",
      ).length,
      completedLiveSessions: data.livePlans.filter(
        (item) => item.status === "completed",
      ).length,
      openModerationTasks: data.livePlans.filter(
        (item) => item.moderationPlan.moderatorNames.length === 0,
      ).length,
      topPerformingContent: top,
      missingCaptionsScripts: data.videoIdeas.filter(
        (idea) =>
          !data.scripts.some((script) => script.ideaId === idea.id) ||
          !data.captions.some((caption) => caption.ideaId === idea.id),
      ).length,
      weeklyConsistencyScore: consistencyScore(data),
      campaignReadinessVerdict: campaignReadiness(
        data,
        data.videoIdeas[0]?.linkedCampaign || "default",
      ).verdict,
    });
  });

  const collection = <T extends keyof Awaited<ReturnType<JsonStore["read"]>>>(
    name: T,
    eventType: string,
    schema: { parse: (body: unknown) => object },
  ) => {
    router.get(`/${String(name)}`, async (_req, res) =>
      res.json((await store.read())[name]),
    );
    router.post(`/${String(name)}`, async (req, res) => {
      const record = withBase(schema.parse(req.body));
      await store.mutate((data) => {
        (data[name] as object[]).push(record);
        data.auditLog.push(audit(eventType, `${eventType} created`, record.id));
      });
      res.status(201).json(record);
    });
  };

  collection(
    "creatorProfiles",
    "creator profile created/updated",
    creatorProfileSchema,
  );
  collection("videoIdeas", "video idea created/updated", videoIdeaSchema);
  collection("scripts", "script created/updated", scriptSchema);
  collection("calendarItems", "calendar item created/updated", calendarSchema);
  collection("analytics", "analytics added", analyticsSchema);

  router.get("/captions", async (_req, res) =>
    res.json((await store.read()).captions),
  );
  router.post("/captions", async (req, res) => {
    const caption = analyzeCaption(
      withBase(captionSchema.parse(req.body)) as CaptionRecord,
    );
    await store.mutate((data) => {
      data.captions.push(caption);
      data.auditLog.push(
        audit(
          "caption created/updated",
          "Caption created with text risk checklist",
          caption.id,
        ),
      );
    });
    res.status(201).json(caption);
  });

  router.get("/hashtags", async (_req, res) => {
    const data = await store.read();
    res.json([
      ...new Set(data.captions.flatMap((caption) => caption.hashtagSet)),
    ]);
  });

  router.get("/livePlans", async (_req, res) =>
    res.json((await store.read()).livePlans),
  );
  router.post("/livePlans", async (req, res) => {
    const parsed = livePlanSchema.parse(req.body);
    const plan = withBase({
      ...parsed,
      runOfShow: parsed.runOfShow.map((segment) => ({
        ...segment,
        id: uuid(),
      })),
    });
    await store.mutate((data) => {
      data.livePlans.push(plan);
      data.auditLog.push(
        audit("LIVE plan created/updated", "LIVE plan created", plan.id),
      );
    });
    res.status(201).json(plan);
  });

  router.post("/livePlans/:id/run-of-show", async (req, res) => {
    const segment = { ...segmentSchema.parse(req.body), id: uuid() };
    const updated = await store.mutate((data) => {
      const plan = data.livePlans.find((item) => item.id === req.params.id);
      if (!plan) return undefined;
      plan.runOfShow.push(segment);
      plan.updatedAt = now();
      data.auditLog.push(
        audit(
          "LIVE plan created/updated",
          "Run-of-show segment added",
          plan.id,
        ),
      );
      return plan;
    });
    if (!updated)
      return res.status(404).json({ error: "LIVE plan not found." });
    res.json(updated);
  });

  router.put("/livePlans/:id/moderation", async (req, res) => {
    const moderationPlan = moderationSchema.parse(req.body);
    const updated = await store.mutate((data) => {
      const plan = data.livePlans.find((item) => item.id === req.params.id);
      if (!plan) return undefined;
      plan.moderationPlan = moderationPlan;
      plan.updatedAt = now();
      data.auditLog.push(
        audit(
          "moderation checklist updated",
          "Moderation checklist updated",
          plan.id,
        ),
      );
      return plan;
    });
    if (!updated)
      return res.status(404).json({ error: "LIVE plan not found." });
    res.json(updated);
  });

  router.put("/livePlans/:id/technical", async (req, res) => {
    const technicalChecklist = technicalSchema.parse(req.body);
    const updated = await store.mutate((data) => {
      const plan = data.livePlans.find((item) => item.id === req.params.id);
      if (!plan) return undefined;
      plan.technicalChecklist = technicalChecklist;
      plan.updatedAt = now();
      data.auditLog.push(
        audit(
          "LIVE plan created/updated",
          "Technical checklist updated",
          plan.id,
        ),
      );
      return plan;
    });
    if (!updated)
      return res.status(404).json({ error: "LIVE plan not found." });
    res.json(updated);
  });

  router.get("/readiness/video/:ideaId", async (req, res) => {
    const readiness = videoReadiness(await store.read(), req.params.ideaId);
    await store.mutate((data) =>
      data.auditLog.push(
        audit(
          "readiness verdict generated",
          `Video readiness: ${readiness.verdict}`,
          req.params.ideaId,
        ),
      ),
    );
    res.json(readiness);
  });

  router.get("/readiness/live/:liveId", async (req, res) => {
    const data = await store.read();
    const plan = data.livePlans.find((item) => item.id === req.params.liveId);
    if (!plan) return res.status(404).json({ error: "LIVE plan not found." });
    const readiness = liveReadiness(plan);
    await store.mutate((current) =>
      current.auditLog.push(
        audit(
          "readiness verdict generated",
          `LIVE readiness: ${readiness.verdict}`,
          req.params.liveId,
        ),
      ),
    );
    res.json(readiness);
  });

  router.post("/reports/video/:ideaId", async (req, res) => {
    const data = await store.read();
    const markdown = videoProductionBrief(data, req.params.ideaId);
    const report = withBase({
      reportType: "video-brief" as const,
      title: "Video Production Brief",
      markdown,
    });
    await store.mutate((current) => {
      current.reports.push(report);
      current.auditLog.push(
        audit(
          "report generated",
          "Video production brief generated",
          req.params.ideaId,
        ),
      );
    });
    res.status(201).json(report);
  });

  router.post("/reports/live/:liveId", async (req, res) => {
    const data = await store.read();
    const plan = data.livePlans.find((item) => item.id === req.params.liveId);
    if (!plan) return res.status(404).json({ error: "LIVE plan not found." });
    const report = withBase({
      reportType: "live-brief" as const,
      title: "LIVE Production Brief",
      markdown: liveProductionBrief(plan),
    });
    await store.mutate((current) => {
      current.reports.push(report);
      current.auditLog.push(
        audit(
          "report generated",
          "LIVE production brief generated",
          req.params.liveId,
        ),
      );
    });
    res.status(201).json(report);
  });

  router.post("/reports/post-live/:liveId", async (req, res) => {
    const data = await store.read();
    const plan = data.livePlans.find((item) => item.id === req.params.liveId);
    if (!plan) return res.status(404).json({ error: "LIVE plan not found." });
    const report = withBase({
      reportType: "post-live" as const,
      title: `Post-LIVE Report - ${plan.liveTitle}`,
      markdown: postLiveReport(plan, data.analytics),
    });
    await store.mutate((current) => {
      current.reports.push(report);
      current.auditLog.push(
        audit(
          "report generated",
          "Post-LIVE report generated",
          req.params.liveId,
        ),
      );
    });
    res.status(201).json(report);
  });

  router.post("/reports/weekly", async (_req, res) => {
    const data = await store.read();
    const report = withBase({
      reportType: "weekly" as const,
      title: "Weekly CreatorOps Report",
      markdown: weeklyCreatorOpsReport(data),
    });
    await store.mutate((current) => {
      current.reports.push(report);
      current.auditLog.push(
        audit("report generated", "Weekly CreatorOps report generated"),
      );
    });
    res.status(201).json(report);
  });

  router.post("/reports/campaign", async (req, res) => {
    const campaignName = String(req.body?.campaignName || "Creator Campaign");
    const data = await store.read();
    const report = withBase({
      reportType: "campaign" as const,
      title: `Campaign Report - ${campaignName}`,
      markdown: campaignReport(data, campaignName),
    });
    await store.mutate((current) => {
      current.reports.push(report);
      current.auditLog.push(
        audit("report generated", "Campaign report generated"),
      );
    });
    res.status(201).json(report);
  });

  router.get("/reports", async (_req, res) =>
    res.json((await store.read()).reports),
  );
  router.get("/auditLog", async (_req, res) =>
    res.json((await store.read()).auditLog),
  );

  return router;
}
