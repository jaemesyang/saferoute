import express from 'express';
import {hotspots} from "./db/schema.js";
import {db} from "./db/index.js";
import {createHotspotSchema} from './schemas/hotspots.js';
import {validateBody} from './middleware/validate.js';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());

type Hotspot = {
  id: number
  name: string,
  lat: number,
  lng: number
}

app.get('/api/hotspots', async (_req, res) => {
  const allHotspots = await db
    .select()
    .from(hotspots);
  const formattedHotspots: Hotspot[] = allHotspots.map((hotspot) => {
    return {
      id: hotspot.id,
      name: hotspot.name,
      lat: hotspot.location.y,
      lng: hotspot.location.x
    }
  });
  res.json(formattedHotspots)
});

app.post('/api/hotspots',
  validateBody(createHotspotSchema),
  async (req, res) => {
  const {name, lat, lng} = req.body;

  const [hotspot] = await db
    .insert(hotspots)
    .values({
      name,
      location: {
        x: lng,
        y: lat,
      },
    })
    .returning();

  res.status(201).json(hotspot);
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
