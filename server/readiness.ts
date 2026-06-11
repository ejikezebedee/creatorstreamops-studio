import type { AppData, LivePlan, Verdict, VideoIdea } from "./types.js";

export interface ReadinessResult {
  verdict: Verdict;
  blockers: string[];
  warnings: string[];
}

const result = (
  blockers: string[],
  warnings: string[] = [],
): ReadinessResult => ({
  verdict: blockers.length
    ? "blocked"
    : warnings.length
      ? "needs-review"
      : "ready",
  blockers,
  warnings,
});

export function videoReadiness(data: AppData, ideaId: string): ReadinessResult {
  const idea = data.videoIdeas.find((item) => item.id === ideaId);
  const script = data.scripts.find((item) => item.ideaId === ideaId);
  const caption = data.captions.find((item) => item.ideaId === ideaId);
  const calendar = data.calendarItems.find((item) => item.ideaId === ideaId);
  const blockers = [
    !idea && "Video idea is missing.",
    !script && "Script record is missing.",
    !caption && "Caption record is missing.",
    script && !script.callToAction && "Script CTA is missing.",
    caption && !caption.callToAction && "Caption CTA is missing.",
    !calendar && "Scheduled calendar item is missing.",
    caption &&
      caption.policyChecklistStatus !== "reviewed" &&
      "Policy checklist is not completed.",
  ].filter(Boolean) as string[];
  const warnings = caption?.riskNotes.length ? caption.riskNotes : [];
  return result(blockers, warnings);
}

export function liveReadiness(plan: LivePlan): ReadinessResult {
  const technicalValues = Object.entries(plan.technicalChecklist).filter(
    ([key]) => key !== "recordingReplayNote",
  );
  const technicalIncomplete = technicalValues.some(
    ([, value]) => value !== true,
  );
  const blockers = [
    !plan.liveTitle && "LIVE title is missing.",
    plan.runOfShow.length === 0 && "Run-of-show is missing.",
    plan.moderationPlan.moderatorNames.length === 0 &&
      "Moderation checklist is incomplete.",
    technicalIncomplete && "Technical checklist is incomplete.",
    !plan.callToAction && "LIVE CTA is missing.",
    !plan.backupPlan && "Backup plan is missing.",
  ].filter(Boolean) as string[];
  return result(blockers);
}

export function campaignReadiness(
  data: AppData,
  campaignName: string,
): ReadinessResult {
  const ideas = data.videoIdeas.filter(
    (idea: VideoIdea) => idea.linkedCampaign === campaignName,
  );
  const scheduled = ideas.some((idea) =>
    data.calendarItems.some((item) => item.ideaId === idea.id),
  );
  const report = data.reports.some((item) => item.title.includes(campaignName));
  const analyticsReviewed = data.analytics.length > 0;
  const blockers = [
    ideas.length === 0 && "At least one video idea is required.",
    !scheduled && "Campaign calendar schedule is missing.",
    !report && "Campaign report has not been generated.",
    !analyticsReviewed && "Analytics have not been reviewed.",
  ].filter(Boolean) as string[];
  return result(blockers);
}

export function consistencyScore(data: AppData): number {
  const planned = data.calendarItems.length;
  const posted = data.calendarItems.filter(
    (item) => item.status === "posted",
  ).length;
  const upcomingLives = data.livePlans.filter(
    (item) => item.status === "ready",
  ).length;
  if (planned === 0) return 0;
  return Math.min(
    100,
    Math.round((posted / planned) * 70 + Math.min(upcomingLives, 3) * 10),
  );
}
