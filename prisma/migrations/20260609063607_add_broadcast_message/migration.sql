-- CreateTable
CREATE TABLE "BroadcastMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "batchId" TEXT,
    "batchName" TEXT,
    "audience" TEXT NOT NULL DEFAULT 'STUDENTS',
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "sentById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
