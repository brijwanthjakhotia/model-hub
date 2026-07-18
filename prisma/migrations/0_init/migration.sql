-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "avatarUrl" TEXT,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MODERATOR',
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Model" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "headshotUrl" TEXT,
    "bio" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "gender" TEXT NOT NULL DEFAULT 'FEMALE',
    "location" TEXT NOT NULL,
    "experience" TEXT NOT NULL DEFAULT 'New Face',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "heightCm" INTEGER NOT NULL,
    "bust" INTEGER,
    "waist" INTEGER,
    "hips" INTEGER,
    "shoeEu" REAL,
    "hairColor" TEXT,
    "eyeColor" TEXT,
    "instagram" TEXT,
    "agencyEmail" TEXT,
    "gallery" TEXT NOT NULL DEFAULT '[]',
    "ratingAvg" REAL NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "reviewNote" TEXT,
    "reviewedAt" DATETIME,
    "reviewedById" TEXT,
    "submittedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Model_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Admin" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Model_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modelId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "Review_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Model_slug_key" ON "Model"("slug");

-- CreateIndex
CREATE INDEX "Model_status_ratingAvg_idx" ON "Model"("status", "ratingAvg");

-- CreateIndex
CREATE INDEX "Model_status_featured_idx" ON "Model"("status", "featured");

-- CreateIndex
CREATE INDEX "Model_status_category_idx" ON "Model"("status", "category");

-- CreateIndex
CREATE INDEX "Model_createdAt_idx" ON "Model"("createdAt");

-- CreateIndex
CREATE INDEX "Model_submittedById_idx" ON "Model"("submittedById");

-- CreateIndex
CREATE INDEX "Model_reviewedById_idx" ON "Model"("reviewedById");

-- CreateIndex
CREATE INDEX "Review_authorId_idx" ON "Review"("authorId");

-- CreateIndex
CREATE INDEX "Review_modelId_createdAt_idx" ON "Review"("modelId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Review_modelId_authorId_key" ON "Review"("modelId", "authorId");

