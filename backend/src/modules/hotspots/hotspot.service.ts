import { randomUUID } from 'node:crypto';
import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { db } from "../../db/index.js";
import { hotspots, rescueRequests } from "../../db/schema.js";
import { ClaimResult, Hotspot, ResolveResult } from "./hotspot.types.js"
import { CreateHotspotInput } from "./hotspot.schema.js";

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

export async function claimHotspot(id: number, dispatcherName: string): Promise<ClaimResult> {
  const newToken = randomUUID();

  const [claimed] = await db
    .update(hotspots)
    .set({
      claimedBy: dispatcherName,
      resolveToken: sql`coalesce(${hotspots.resolveToken}, ${newToken})`,
    })
    .where(
      and(
        eq(hotspots.id, id),
        or(isNull(hotspots.claimedBy), eq(hotspots.claimedBy, dispatcherName)),
      ),
    )
    .returning({
      claimedBy: hotspots.claimedBy,
      resolveToken: hotspots.resolveToken,
    });

  if (claimed?.claimedBy && claimed.resolveToken) {
    return {
      status: 'claimed',
      claimedBy: claimed.claimedBy,
      resolveToken: claimed.resolveToken,
    };
  }

  const [existing] = await db
    .select({ claimedBy: hotspots.claimedBy })
    .from(hotspots)
    .where(eq(hotspots.id, id))
    .limit(1);

  if (!existing) {
    return { status: 'notFound' };
  }

  return { status: 'conflict', claimedBy: existing.claimedBy ?? dispatcherName };
}

export async function resolveHotspot(id: number, token: string): Promise<ResolveResult> {
  return db.transaction(async (tx) => {
    const [hotspot] = await tx
      .select({ resolveToken: hotspots.resolveToken })
      .from(hotspots)
      .where(eq(hotspots.id, id))
      .limit(1);

    if (!hotspot) {
      return { status: 'notFound' };
    }

    if (!hotspot.resolveToken || hotspot.resolveToken !== token) {
      return { status: 'badToken' };
    }

    await tx
      .update(rescueRequests)
      .set({ assignedHotspotId: null })
      .where(eq(rescueRequests.assignedHotspotId, id));

    await tx.delete(hotspots).where(eq(hotspots.id, id));

    return { status: 'resolved' };
  });
}
