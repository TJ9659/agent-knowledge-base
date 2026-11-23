-- lets kb user create prisma shadow dbs for migrate dev
GRANT ALL PRIVILEGES ON `prisma_migrate_shadow_db%`.* TO 'kb'@'%';
FLUSH PRIVILEGES;
