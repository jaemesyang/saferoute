import {Request, Response} from "express";
import * as closestService from './closest.service.js'

export async function getClosest(
  req: Request,
  res: Response
) {
  const hotspots = await closestService.getClosest(req.body);
  res.json(hotspots);
}