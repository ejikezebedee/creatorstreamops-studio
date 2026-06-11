import {
  consistencyScore,
  liveReadiness,
  videoReadiness,
} from "./readiness.js";
import type { AppData, AnalyticsEntry, LivePlan, VideoIdea } from "./types.js";

const bullet = (items: string[]) =>
  items.length
    ? items.map((item) => `- ${item}`).join("\n")
    : "- None recorded";

export function videoProductionBrief(data: AppData, ideaId: string): string {
  const idea = data.videoIdeas.find((item) => item.id === ideaId);
  const script = data.scripts.find((item) => item.ideaId === ideaId);
  const caption = data.captions.find((item) => item.ideaId === ideaId);
  const readiness = videoReadiness(data, ideaId);
  return `# Video Production Brief

## Idea
${idea?.title || "Untitled"}

## Hook
${script?.hook || idea?.hook || "Not drafted"}

## Script
${script ? `${script.openingLine}\n\n${bullet(script.mainPoints)}` : "No script record."}

## Shot List
${bullet(script?.shotList || [])}

## Caption
${caption?.captionDraft || "No caption drafted."}

## Hashtags
${bullet(caption?.hashtagSet || [])}

## CTA
${script?.callToAction || caption?.callToAction || "No CTA."}

## Readiness Verdict
${readiness.verdict}

${bullet([...readiness.blockers, ...readiness.warnings])}
`;
}

export function liveProductionBrief(plan: LivePlan): string {
  const readiness = liveReadiness(plan);
  return `# LIVE Production Brief

## LIVE
${plan.liveTitle}

## Objective
${plan.objective}

## Run Of Show
${plan.runOfShow.map((segment) => `- ${segment.plannedStartMinute}m: ${segment.segmentTitle} (${segment.duration}m)`).join("\n") || "- No segments"}

## Moderation Plan
Moderators: ${plan.moderationPlan.moderatorNames.join(", ") || "None"}

Rules:
${bullet(plan.moderationPlan.rulesToRemindAudience)}

## Technical Checklist
${Object.entries(plan.technicalChecklist)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join("\n")}

## CTA
${plan.callToAction}

## Backup Plan
${plan.backupPlan || "No backup plan."}

## Readiness Verdict
${readiness.verdict}

${bullet(readiness.blockers)}
`;
}

export function postLiveReport(
  plan: LivePlan,
  analytics: AnalyticsEntry[],
): string {
  const related = analytics.filter(
    (entry) => entry.entryType === "live" && entry.title === plan.liveTitle,
  );
  const totals = related.reduce(
    (acc, item) => ({
      views: acc.views + item.views,
      likes: acc.likes + item.likes,
      comments: acc.comments + item.comments,
      shares: acc.shares + item.shares,
      follows: acc.follows + item.followsGained,
    }),
    { views: 0, likes: 0, comments: 0, shares: 0, follows: 0 },
  );
  return `# Post-LIVE Report

## ${plan.liveTitle}
Objective: ${plan.objective}

## Run-Of-Show Summary
${plan.runOfShow.map((segment) => `- ${segment.segmentTitle}: ${segment.talkingPoints.join("; ")}`).join("\n") || "- No run-of-show captured"}

## Engagement Summary
- Views: ${totals.views}
- Likes: ${totals.likes}
- Comments: ${totals.comments}
- Shares: ${totals.shares}
- Follows gained: ${totals.follows}

## Top Questions
${bullet(related.flatMap((entry) => entry.topQuestions))}

## Product/Sales Notes
${bullet(related.map((entry) => entry.salesNotes).filter(Boolean))}

## Moderation Incidents
${plan.moderationPlan.escalationNotes || "No incidents recorded."}

## What Worked
${bullet(related.map((entry) => entry.audienceFeedback).filter(Boolean))}

## What Failed
${bullet(related.map((entry) => entry.lessonsLearned).filter(Boolean))}

## Follow-Up Content Ideas
${bullet(plan.questionsToAskAudience.map((question) => `Answer this audience question as a short video: ${question}`))}

## Recommended Clips To Create
${bullet(plan.runOfShow.slice(0, 3).map((segment) => `${segment.segmentTitle} highlight clip`))}

## Next LIVE Improvements
${plan.backupPlan}
`;
}

export function weeklyCreatorOpsReport(data: AppData): string {
  const videosPlanned = data.calendarItems.length;
  const videosCompleted = data.calendarItems.filter(
    (item) => item.status === "posted",
  ).length;
  const livesPlanned = data.livePlans.length;
  const livesCompleted = data.livePlans.filter(
    (item) => item.status === "completed",
  ).length;
  return `# Weekly CreatorOps Report

## Production
- Videos planned: ${videosPlanned}
- Videos completed: ${videosCompleted}
- LIVE sessions planned: ${livesPlanned}
- LIVE sessions completed: ${livesCompleted}

## Analytics Summary
${bullet(data.analytics.map((entry) => `${entry.title}: ${entry.views} views, ${entry.followsGained} follows gained`))}

## Consistency Score
${consistencyScore(data)}

## Next Actions
- Complete missing scripts and captions.
- Review manual analytics before scheduling the next content batch.
- Convert strongest LIVE questions into short-form clips.
`;
}

export function campaignReport(data: AppData, campaignName: string): string {
  const ideas = data.videoIdeas.filter(
    (idea: VideoIdea) => idea.linkedCampaign === campaignName,
  );
  const posted = ideas.filter((idea) => idea.status === "posted").length;
  const pillarCounts = ideas.reduce<Record<string, number>>((acc, idea) => {
    acc[idea.contentPillar] = (acc[idea.contentPillar] || 0) + 1;
    return acc;
  }, {});
  const sorted = Object.entries(pillarCounts).sort((a, b) => b[1] - a[1]);
  return `# Campaign Report

## ${campaignName}
- Videos planned: ${ideas.length}
- Videos posted: ${posted}
- LIVE sessions planned/completed: ${data.livePlans.length}/${data.livePlans.filter((item) => item.status === "completed").length}

## Performance Summary
${bullet(data.analytics.map((entry) => `${entry.title}: ${entry.views} views, ${entry.likes} likes, ${entry.shares} shares`))}

## Best Content Pillar
${sorted[0]?.[0] || "Not enough data"}

## Weakest Content Pillar
${sorted.at(-1)?.[0] || "Not enough data"}

## Consistency Score
${consistencyScore(data)}

## Next Recommended Actions
- Publish the strongest drafted item.
- Prepare one LIVE segment around the most repeated audience question.
- Review sponsorship disclosure before campaign captions go live.
`;
}
