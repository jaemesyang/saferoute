import { z } from 'zod';

export const getClosestSchema = z.object({
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
});

export type GetClosestInput = z.infer<typeof getClosestSchema>;