import {Request, Response} from 'express';
import * as rescueRequestService from './rescueRequest.service.js';
import {pickupSchema} from './rescueRequest.schema.js';

export async function createReport(req: Request, res: Response) {
  const report = await rescueRequestService.createReport(req.body);
  res.json(report);
}

export async function arrived(req: Request, res: Response) {
  await rescueRequestService.arrived(req.body);
  res.status(204).end()
}

export async function getStatus(req: Request, res: Response) {
  const parsed = pickupSchema.safeParse({token: req.params.token});
  if (!parsed.success) {
    res.status(400).json({error: 'Invalid request'});
    return;
  }

  const status = await rescueRequestService.getStatus(parsed.data.token);
  if (!status) {
    res.status(404).json({error: 'Request not found'});
    return;
  }

  res.json(status);
}

export async function pickup(req: Request, res: Response) {
  const stats = await rescueRequestService.pickup(req.body);
  res.json(stats);
}
