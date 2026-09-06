import {db} from "../../db/index.js";
import {hotspots, rescueRequests} from "../../db/schema.js";
import {ArrivedInput, CreateReportInput} from "./rescueRequest.schema.js";
import {sql, eq, and, isNotNull} from 'drizzle-orm';
import {ClosestHotspot, Point, ReportAssignment} from './rescueRequest.types.js';

async function getClosest(input: CreateReportInput): Promise<ClosestHotspot | null> {
  const point: Point = {
    x: input.lng,
    y: input.lat
  };
  const sqlPoint = sql`ST_SetSRID(ST_MakePoint(${point.x}, ${point.y}), 4326)`;

  const [closest] = await db
    .select({
      id: hotspots.id,
      name: hotspots.name,
      location: hotspots.location,
      distanceMeters: sql<number>`ST_Distance(${hotspots.location}::geography, ${sqlPoint}::geography )`,
    })
    .from(hotspots)
    .orderBy(sql`${hotspots.location} <-> ${sqlPoint}`)
    .limit(1);

  if (!closest) {
    return null;
  }

  return {
    id: closest.id,
    name: closest.name,
    lat: closest.location.y,
    lng: closest.location.x,
    distanceMeters: closest.distanceMeters,
  };
}

export async function createReport(input: CreateReportInput): Promise<ReportAssignment | null> {
  const closest = await getClosest(input);

  if (!closest) {
    return null;
  }

  const report = await db.transaction(async (tx) => {
    await tx
      .update(hotspots)
      .set({
        assigned: sql`${hotspots.assigned} + 1`
      })
      .where(eq(hotspots.id, closest.id));

    const [created] = await tx
      .insert(rescueRequests)
      .values({
        assignedHotspotId: closest.id,
        status: 'assigned',
      })
      .returning({id: rescueRequests.id});

    return created;
  });

  return {
    id: String(report.id),
    name: closest.name,
    lat: closest.lat,
    lng: closest.lng,
    distanceMeters: closest.distanceMeters,
  };
}

export async function arrived(input: ArrivedInput) {
  await db.transaction(async (tx) => {
    const [request] = await tx
      .update(rescueRequests)
      .set({
        status: 'arrived'
      })
      .where(
        and(
          eq(rescueRequests.id, input.id),
          eq(rescueRequests.status, 'assigned'),
          isNotNull(rescueRequests.assignedHotspotId)
        )
      )
      .returning({
        assignedHotspotId: rescueRequests.assignedHotspotId
      })
    if (!request || request.assignedHotspotId == null) {
      throw new Error('Request is not assigned to a hotspot');
    }
    await tx
      .update(hotspots)
      .set({
        assigned: sql`${hotspots.assigned} - 1`,
        arrived: sql`${hotspots.arrived} + 1`
      })
      .where(eq(hotspots.id, request.assignedHotspotId))
  })
}