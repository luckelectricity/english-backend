-- CreateTable
CREATE TABLE "OxfordWord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "partOfSpeech" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "rank" INTEGER NOT NULL
);

-- CreateIndex
CREATE INDEX "OxfordWord_level_idx" ON "OxfordWord"("level");

-- CreateIndex
CREATE UNIQUE INDEX "OxfordWord_text_partOfSpeech_key" ON "OxfordWord"("text", "partOfSpeech");
