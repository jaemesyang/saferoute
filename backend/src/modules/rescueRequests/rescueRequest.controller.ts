import {Request, Response} from 'express';
import * as rescueRequestService from './rescueRequest.service.js';

export async function createReport(req: Request, res: Response) {
  const report = await rescueRequestService.createReport(req.body);
  res.json(report);
}

export async function arrived(req: Request, res: Response) {
  await rescueRequestService.arrived(req.body);
  res.status(204).end()
}

export async function pickup(req: Request, res: Response) {
  const stats = await rescueRequestService.pickup(req.body);
  res.json(stats);
}