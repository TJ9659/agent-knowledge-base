-- lets kb user create prisma shadow dbs for migrate dev
GRANT ALL PRIVILEGES ON `prisma_migrate_shadow_db%`.* TO 'kb'@'%';
-- separate database for the backend integration tests
GRANT ALL PRIVILEGES ON `kb_test`.* TO 'kb'@'%';
FLUSH PRIVILEGES;
