import { z } from 'zod';

import { cvStatusValues } from '../constants/app';

export const cvUploadSchema = z.object({
  title: z.string().min(2).max(120),
  categoryId: z.string().uuid(),
});

export const cvUpdateSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  categoryId: z.string().uuid().optional(),
  status: z.enum(cvStatusValues).optional(),
});

export type CvUploadInput = z.infer<typeof cvUploadSchema>;
export type CvUpdateInput = z.infer<typeof cvUpdateSchema>;
