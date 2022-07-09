-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fansub" TEXT NOT NULL,
    "magnet" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL
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

-- CreateIndex
CREATE UNIQUE INDEX "Resource_title_key" ON "Resource"("title");
