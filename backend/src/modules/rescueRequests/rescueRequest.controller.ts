import {Request, Response} from 'express';
import * as rescueRequestService from './rescueRequest.service.js';

export async function getClosest(_req: Request, res: Response) {
  const hotspot = await rescueRequestService.getClosest(res.locals.query);
  res.json(hotspot);
}
