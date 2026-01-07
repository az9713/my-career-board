-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "settings" TEXT NOT NULL DEFAULT '{"llm_provider": "anthropic", "notifications_enabled": true}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "whatBreaks" TEXT NOT NULL,
    "scarcitySignals" TEXT NOT NULL DEFAULT '[]',
    "aiCheaper" TEXT,
    "errorCost" TEXT,
    "trustRequired" TEXT,
    "classification" TEXT NOT NULL,
    "classificationReasoning" TEXT,
    "timeAllocation" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Problem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BoardRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "roleType" TEXT NOT NULL,
    "anchoredProblemId" TEXT,
    "focusArea" TEXT NOT NULL,
    "systemPrompt" TEXT,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BoardRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BoardRole_anchoredProblemId_fkey" FOREIGN KEY ("anchoredProblemId") REFERENCES "Problem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BoardSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sessionType" TEXT NOT NULL,
    "quarter" TEXT,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "currentPhase" INTEGER NOT NULL DEFAULT 1,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "BoardSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "speaker" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SessionMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "BoardSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuarterlyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "lastBet" TEXT,
    "lastBetWrongIf" TEXT,
    "lastBetResult" TEXT,
    "lastBetEvidence" TEXT,
    "commitments" TEXT,
    "avoidedDecision" TEXT NOT NULL,
    "avoidedDecisionWhy" TEXT NOT NULL,
    "avoidedDecisionCost" TEXT NOT NULL,
    "comfortWork" TEXT NOT NULL,
    "comfortWorkAvoided" TEXT NOT NULL,
    "nextBet" TEXT NOT NULL,
    "nextBetWrongIf" TEXT NOT NULL,
    "overallAssessment" TEXT,
    "concerns" TEXT,
    "actionItems" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuarterlyReport_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "BoardSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuarterlyReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Problem_userId_idx" ON "Problem"("userId");

-- CreateIndex
CREATE INDEX "BoardRole_userId_idx" ON "BoardRole"("userId");

-- CreateIndex
CREATE INDEX "BoardSession_userId_idx" ON "BoardSession"("userId");

-- CreateIndex
CREATE INDEX "BoardSession_status_idx" ON "BoardSession"("status");

-- CreateIndex
CREATE INDEX "SessionMessage_sessionId_idx" ON "SessionMessage"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuarterlyReport_sessionId_key" ON "QuarterlyReport"("sessionId");

-- CreateIndex
CREATE INDEX "QuarterlyReport_userId_idx" ON "QuarterlyReport"("userId");
