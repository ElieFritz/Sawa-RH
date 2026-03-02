import { z } from 'zod';

import { reportTargetTypeValues } from '../constants/app';

export const reportCreateSchema = z.object({
  targetType: z.enum(reportTargetTypeValues),
  targetId: z.string().min(1),
  reason: z.string().min(10).max(1000),
});

export type ReportCreateInput = z.infer<typeof reportCreateSchema>;
