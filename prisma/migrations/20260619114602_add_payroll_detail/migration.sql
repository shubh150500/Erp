-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN "bankAccount" TEXT;
ALTER TABLE "Teacher" ADD COLUMN "bankName" TEXT;
ALTER TABLE "Teacher" ADD COLUMN "designation" TEXT;
ALTER TABLE "Teacher" ADD COLUMN "ifsc" TEXT;
ALTER TABLE "Teacher" ADD COLUMN "joinDate" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SalaryPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "gross" REAL,
    "bonus" REAL NOT NULL DEFAULT 0,
    "deductions" REAL NOT NULL DEFAULT 0,
    "advance" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "paidAmount" REAL,
    "forMonth" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'BANK',
    "note" TEXT,
    "paidAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "SalaryPayment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SalaryPayment" ("amount", "createdById", "forMonth", "id", "mode", "note", "paidAt", "teacherId") SELECT "amount", "createdById", "forMonth", "id", "mode", "note", "paidAt", "teacherId" FROM "SalaryPayment";
DROP TABLE "SalaryPayment";
ALTER TABLE "new_SalaryPayment" RENAME TO "SalaryPayment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
