import { z } from 'zod';

export const createHotspotSchema = z.object({
  name: z.string().trim().min(1).max(100),
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
});

export type CreateHotspotInput = z.infer<typeof createHotspotSchema>;