import {Request, Response} from 'express';
import * as rescueRequestService from './rescueRequest.service.js';

export async function createReport(_req: Request, res: Response) {
  const report = await rescueRequestService.createReport(res.locals.query);
  res.json(report);
}
