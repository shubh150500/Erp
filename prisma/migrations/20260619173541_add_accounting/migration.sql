-- AlterTable
ALTER TABLE "Expense" ADD COLUMN "invoiceImage" TEXT;

-- CreateTable
CREATE TABLE "OtherIncome" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "amount" REAL NOT NULL,
    "note" TEXT,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Teacher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subject" TEXT,
    "bio" TEXT,
    "monthlySalary" REAL NOT NULL DEFAULT 0,
    "staffType" TEXT NOT NULL DEFAULT 'TEACHING',
    "designation" TEXT,
    "joinDate" DATETIME,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "ifsc" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Teacher" ("bankAccount", "bankName", "bio", "createdAt", "designation", "id", "ifsc", "joinDate", "monthlySalary", "subject", "userId") SELECT "bankAccount", "bankName", "bio", "createdAt", "designation", "id", "ifsc", "joinDate", "monthlySalary", "subject", "userId" FROM "Teacher";
DROP TABLE "Teacher";
ALTER TABLE "new_Teacher" RENAME TO "Teacher";
CREATE UNIQUE INDEX "Teacher_userId_key" ON "Teacher"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
