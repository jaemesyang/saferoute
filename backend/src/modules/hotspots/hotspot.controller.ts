import {Request, Response} from "express";
import * as hotspotService from './hotspot.service.js'

export async function getHotspots(
  _req: Request,
  res: Response
) {
  const hotspots = await hotspotService.getHotspots();
  res.json(hotspots);
}

export async function createHotspot(
  req: Request,
  res: Response
) {
  const hotspot = await hotspotService.createHotspot(req.body);
  res.status(201).json(hotspot);
}