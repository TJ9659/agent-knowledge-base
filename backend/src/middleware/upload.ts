import multer from 'multer';

const MAX_PDF_BYTES = 5 * 1024 * 1024;

// kept in memory and never written to disk, the pdf is only read once
// a file that isn't a pdf is skipped, so req.file is empty and the controller says so
export const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PDF_BYTES, files: 1 },
  fileFilter: (_req, file, done) => done(null, file.mimetype === 'application/pdf'),
}).single('file');
