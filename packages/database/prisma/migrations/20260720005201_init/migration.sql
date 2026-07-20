-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PENDING', 'MEMBER', 'ADMIN', 'MASTER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MarkerTag" AS ENUM ('MAIN', 'MARKER', 'MAKER', 'FARM', 'PK', 'SUPPORT');

-- CreateEnum
CREATE TYPE "GuildEventType" AS ENUM ('JOIN', 'LEAVE', 'PROMOTION', 'DEMOTION', 'LEVEL_UP', 'ONLINE', 'OFFLINE', 'TRANSFER', 'DEATH');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LEVEL_UP', 'TRANSFER', 'NEW_MEMBER', 'MEMBER_LEFT', 'BOSS', 'RANK_CHANGE', 'PROMOTION');

-- CreateEnum
CREATE TYPE "IntegrationKey" AS ENUM ('TEAMSPEAK', 'X3T_BOT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "discordTag" TEXT,
    "login" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PENDING',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "world" TEXT NOT NULL,
    "isPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "markerTag" "MarkerTag" NOT NULL DEFAULT 'MARKER',
    "vocation" TEXT,
    "level" INTEGER,
    "residence" TEXT,
    "guildName" TEXT,
    "guildRank" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "loyaltyTitle" TEXT,
    "achievementPoints" INTEGER,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuildMember" (
    "id" TEXT NOT NULL,
    "characterName" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "vocation" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "world" TEXT NOT NULL,
    "joinDate" TIMESTAMP(3) NOT NULL,
    "online" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenOnlineAt" TIMESTAMP(3),
    "lastLevelUpAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuildMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuildSnapshot" (
    "id" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guildName" TEXT,
    "world" TEXT,
    "logoUrl" TEXT,
    "description" TEXT,
    "memberCount" INTEGER NOT NULL,
    "onlineCount" INTEGER NOT NULL,
    "avgLevel" DOUBLE PRECISION NOT NULL,
    "maxLevel" INTEGER NOT NULL,
    "raw" JSONB NOT NULL,

    CONSTRAINT "GuildSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LevelHistory" (
    "id" TEXT NOT NULL,
    "characterName" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LevelHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuildEvent" (
    "id" TEXT NOT NULL,
    "type" "GuildEventType" NOT NULL,
    "characterName" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuildEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Death" (
    "id" TEXT NOT NULL,
    "characterName" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "killer" TEXT NOT NULL,
    "mostDamageBy" TEXT,
    "world" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Death_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL,
    "characterName" TEXT NOT NULL,
    "fromWorld" TEXT NOT NULL,
    "toWorld" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorldSnapshot" (
    "id" TEXT NOT NULL,
    "world" TEXT NOT NULL,
    "onlineCount" INTEGER NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorldSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationConfig" (
    "id" TEXT NOT NULL,
    "key" "IntegrationKey" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Character_name_key" ON "Character"("name");

-- CreateIndex
CREATE INDEX "Character_world_idx" ON "Character"("world");

-- CreateIndex
CREATE INDEX "Character_userId_idx" ON "Character"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GuildMember_characterName_key" ON "GuildMember"("characterName");

-- CreateIndex
CREATE INDEX "GuildMember_online_idx" ON "GuildMember"("online");

-- CreateIndex
CREATE INDEX "GuildMember_rank_idx" ON "GuildMember"("rank");

-- CreateIndex
CREATE INDEX "GuildSnapshot_capturedAt_idx" ON "GuildSnapshot"("capturedAt");

-- CreateIndex
CREATE INDEX "LevelHistory_characterName_recordedAt_idx" ON "LevelHistory"("characterName", "recordedAt");

-- CreateIndex
CREATE INDEX "GuildEvent_type_occurredAt_idx" ON "GuildEvent"("type", "occurredAt");

-- CreateIndex
CREATE INDEX "GuildEvent_characterName_idx" ON "GuildEvent"("characterName");

-- CreateIndex
CREATE INDEX "Death_characterName_idx" ON "Death"("characterName");

-- CreateIndex
CREATE INDEX "Death_world_occurredAt_idx" ON "Death"("world", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "Death_characterName_occurredAt_killer_key" ON "Death"("characterName", "occurredAt", "killer");

-- CreateIndex
CREATE INDEX "Transfer_characterName_idx" ON "Transfer"("characterName");

-- CreateIndex
CREATE INDEX "Transfer_occurredAt_idx" ON "Transfer"("occurredAt");

-- CreateIndex
CREATE INDEX "Transfer_toWorld_occurredAt_idx" ON "Transfer"("toWorld", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_characterName_occurredAt_key" ON "Transfer"("characterName", "occurredAt");

-- CreateIndex
CREATE INDEX "WorldSnapshot_world_capturedAt_idx" ON "WorldSnapshot"("world", "capturedAt");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConfig_key_key" ON "IntegrationConfig"("key");

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
