-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Word" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "phonetic" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Word_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Word" ("createdAt", "id", "phonetic", "text", "updatedAt", "userId") SELECT "createdAt", "id", "phonetic", "text", "updatedAt", "userId" FROM "Word";
DROP TABLE "Word";
ALTER TABLE "new_Word" RENAME TO "Word";
CREATE INDEX "Word_userId_idx" ON "Word"("userId");
CREATE UNIQUE INDEX "Word_text_userId_key" ON "Word"("text", "userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
