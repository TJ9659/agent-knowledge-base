import { z } from 'zod';

// same shape for create and rename
export const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
});

export type CategoryInput = z.infer<typeof categorySchema>;
