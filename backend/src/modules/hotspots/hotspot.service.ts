import {db} from "../../db/index.js";
import {hotspots} from "../../db/schema.js";
import {Hotspot} from "./hotspot.types.js"
import {CreateHotspotInput} from "./hotspot.schema.js";

export async function getHotspots() {
  const allHotspots = await db
    .select()
    .from(hotspots);
  const formattedHotspots: Hotspot[] = allHotspots.map((hotspot) => {
    return {
      id: hotspot.id,
      name: hotspot.name,
      lat: hotspot.location.y,
      lng: hotspot.location.x,
      headcount: hotspot.headcount
    }
  });
  return formattedHotspots;
}

export async function createHotspot(input: CreateHotspotInput) {
  const {name, lat, lng} = input;

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