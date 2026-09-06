import {Request, Response} from "express";
import * as hotspotService from './hotspot.service.js'
import {hotspotIdSchema} from "./hotspot.schema.js";

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
  const id = hotspotIdSchema.safeParse(req.params.id);

  if (!id.success) {
    return res.status(400).json({error: 'Invalid hotspot id'});
  }

  const result = await hotspotService.claimHotspot(id.data, req.body.dispatcherName);

  if (result.status === 'notFound') {
    return res.status(404).json({error: 'Hotspot not found'});
  }

  if (result.status === 'conflict') {
    return res.status(409).json({
      error: `Hotspot already claimed by ${result.claimedBy}`,
      claimedBy: result.claimedBy,
    });
  }

  res.json({claimedBy: result.claimedBy, resolveToken: result.resolveToken});
}

export async function resolveHotspot(
  req: Request,
  res: Response
) {
  const id = hotspotIdSchema.safeParse(req.params.id);

  if (!id.success) {
    return res.status(400).json({error: 'Invalid hotspot id'});
  }

  const result = await hotspotService.resolveHotspot(id.data, req.body.token);

  if (result.status === 'notFound') {
    return res.status(404).json({error: 'Hotspot not found'});
  }

  if (result.status === 'badToken') {
    return res.status(403).json({error: 'Invalid resolve token'});
  }

  res.json({resolved: true});
}
