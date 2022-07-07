-- CreateTable
CREATE TABLE "Resource" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "link" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fansub" TEXT NOT NULL,
    "magnet" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL
);
