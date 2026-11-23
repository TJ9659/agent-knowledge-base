-- CreateIndex
CREATE FULLTEXT INDEX `article_search` ON `Article`(`title`, `content`);
