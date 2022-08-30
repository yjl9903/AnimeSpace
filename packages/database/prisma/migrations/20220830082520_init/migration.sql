-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fansub" TEXT NOT NULL,
    "magnet" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "keywords" TEXT NOT NULL DEFAULT ''
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "cover" TEXT,
    "playUrls" TEXT NOT NULL,
    "magnetId" TEXT,
    "directory" TEXT,
    "hash" TEXT,

    PRIMARY KEY ("id", "platform"),
    CONSTRAINT "Video_magnetId_fkey" FOREIGN KEY ("magnetId") REFERENCES "Resource" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Episode" (
    "magnetId" TEXT NOT NULL PRIMARY KEY,
    "bgmId" INTEGER NOT NULL,
    "ep" INTEGER NOT NULL DEFAULT 1,
    "fansub" TEXT NOT NULL DEFAULT '',
    "attrs" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "Episode_magnetId_fkey" FOREIGN KEY ("magnetId") REFERENCES "Resource" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Resource_title_key" ON "Resource"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Video_magnetId_key" ON "Video"("magnetId");
