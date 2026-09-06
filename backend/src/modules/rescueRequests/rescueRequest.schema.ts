import { z } from 'zod';

export const createReportSchema = z.object({
  lat: z.coerce.number().gte(-90).lte(90),
  lng: z.coerce.number().gte(-180).lte(180),
});

export const arrivedSchema = z.object({
  id: z.coerce.number().gte(0)
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type ArrivedInput = z.infer<typeof arrivedSchema>;