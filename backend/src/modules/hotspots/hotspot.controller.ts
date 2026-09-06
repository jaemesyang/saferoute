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

export async function claimHotspot(
  req: Request,
  res: Response
) {
  const hotspot = await hotspotService.claimHotspot(req.body);

  if (!hotspot) {
    return res.status(404).json({error: 'Hotspot not found'});
  }

  res.json(hotspot);
}

export async function resolveHotspot(
  req: Request,
  res: Response
) {
  await hotspotService.resolveHotspot(req.body);

  res.json({resolved: true});
}
