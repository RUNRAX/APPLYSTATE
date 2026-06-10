# Real-time Background Agent Status UI

The goal is to provide real-time visibility into the background `DiscoveryWorker`'s actions directly within the Review Queue dashboard. This will reassure the user that the agent is actively working (e.g., logging in, navigating, extracting jobs) even when the browser is running headlessly or out of sight.

## User Review Required

> [!IMPORTANT]
> This requires adding a new table to the database (`AgentStatus`). This will require running a Prisma migration (`npx prisma db push` or `migrate dev`). Let me know if you approve this schema change!

## Proposed Changes

### Database & Schema

#### [MODIFY] [schema.prisma](file:///d:/APPLYSTATE/prisma/schema.prisma)
Add a new model to track real-time agent status per user:
```prisma
model AgentStatus {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  status    String   // e.g., "IDLE", "AUTHENTICATING", "SEARCHING", "EXTRACTING", "WAITING_FOR_LOGIN"
  message   String   // e.g., "Navigating to LinkedIn job search feed..."
  updatedAt DateTime @default(now())
}
```

### Backend Worker

#### [MODIFY] [discovery.worker.ts](file:///d:/APPLYSTATE/src/workers/discovery.worker.ts)
- Add a helper function `updateAgentStatus(userId, status, message)` that upserts the `AgentStatus` table.
- Call this helper at key lifecycle points (e.g., starting harvest, opening browser, extracting jobs, sleeping).

#### [MODIFY] [linkedin.strategy.ts](file:///d:/APPLYSTATE/src/features/automation/strategies/linkedin.strategy.ts)
- Pass a callback or `updateAgentStatus` to the strategy so it can emit granular updates like "Waiting for manual login..." or "Found 10 job cards on page 1".

### Frontend Dashboard

#### [NEW] [agent.ts](file:///d:/APPLYSTATE/src/app/actions/agent.ts)
- Create a Next.js Server Action `getAgentStatus()` that fetches the current status from the database.

#### [NEW] [AgentStatusIndicator.tsx](file:///d:/APPLYSTATE/src/app/dashboard/review/AgentStatusIndicator.tsx)
- Create a client component that polls `getAgentStatus()` every 3-5 seconds.
- Render a sleek UI indicator (e.g., a pulsing dot, `AuroraBackground` or a clean `GlassCard` banner) showing the current state and message.

#### [MODIFY] [ReviewQueueClient.tsx](file:///d:/APPLYSTATE/src/app/dashboard/review/ReviewQueueClient.tsx)
- Embed the `<AgentStatusIndicator />` prominently at the top of the queue.

## Verification Plan
1. Apply the database schema change.
2. Run the `discovery.worker.ts` locally.
3. Open the Review Queue in the web app and visually verify that the status banner updates in real-time as the worker progresses through the LinkedIn scraping phases.
