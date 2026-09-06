import { z } from 'zod';

export const createHotspotSchema = z.object({
  name: z.string().trim().min(1).max(100),
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
});

export const claimHotspotSchema = z.object({
  dispatcherName: z.string().trim().min(1).max(100),
});

export const resolveHotspotSchema = z.object({
  token: z.string().trim().min(1),
});

export const hotspotIdSchema = z.coerce.number().int().positive();

export type CreateHotspotInput = z.infer<typeof createHotspotSchema>;
export type ClaimHotspotInput = z.infer<typeof claimHotspotSchema>;
export type ResolveHotspotInput = z.infer<typeof resolveHotspotSchema>;
