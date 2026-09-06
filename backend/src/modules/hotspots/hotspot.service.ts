import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db } from "../../db/index.js";
import { hotspots, rescueRequests } from "../../db/schema.js";
import { Hotspot } from "./hotspot.types.js"
import { ClaimHotspotInput, CreateHotspotInput, ResolveHotspotInput } from "./hotspot.schema.js";

export async function getHotspots() {
  const allHotspots = await db
    .select({
      id: hotspots.id,
      name: hotspots.name,
      location: hotspots.location,
      assigned: hotspots.assigned,
      arrived: hotspots.arrived,
      claimedBy: hotspots.claimedBy,
    })
    .from(hotspots);
  const formattedHotspots: Hotspot[] = allHotspots.map((hotspot) => {
    return {
      id: hotspot.id,
      name: hotspot.name,
      lat: hotspot.location.y,
      lng: hotspot.location.x,
      assigned: hotspot.assigned,
      arrived: hotspot.arrived,
      claimedBy: hotspot.claimedBy,
    }
  });
  return formattedHotspots;
}

export async function createHotspot(input: CreateHotspotInput) {
  const { name, lat, lng } = input;

  const [hotspot] = await db
    .insert(hotspots)
    .values({
      name: name,
      location: {
        x: lng,
        y: lat,
      }
    })
    .returning();

  return hotspot;
}

export async function claimHotspot(input: ClaimHotspotInput) {
  const [claimed] = await db
    .update(hotspots)
    .set({
      claimedBy: input.dispatcherName,
      resolveToken: randomUUID(),
    })
    .where(eq(hotspots.id, input.id))
    .returning({ claimedBy: hotspots.claimedBy, resolveToken: hotspots.resolveToken });

  return claimed;
}

export async function resolveHotspot(input: ResolveHotspotInput) {
  const [deleted] = await db
    .select({ id: hotspots.id })
    .from(hotspots)
    .where(and(eq(hotspots.id, input.id), eq(hotspots.resolveToken, input.token)))
    .limit(1);

  if (deleted) {
    await db
      .update(rescueRequests)
      .set({ assignedHotspotId: null })
      .where(eq(rescueRequests.assignedHotspotId, input.id));

    await db
      .delete(hotspots)
      .where(eq(hotspots.id, input.id));
  }
}
