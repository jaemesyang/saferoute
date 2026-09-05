import {db} from "../../db/index.js";
import {hotspots} from "../../db/schema.js";
import {GetClosestInput} from "./rescueRequest.schema.js";
import {sql} from 'drizzle-orm';
import {ClosestHotspot, Point} from './rescueRequest.types.js';

export async function getClosest(input: GetClosestInput): Promise<ClosestHotspot | null> {
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
      distanceMeters: sql<number>`ST_Distance(${hotspots.location}::geography, ${sqlPoint}::geography)`,
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
