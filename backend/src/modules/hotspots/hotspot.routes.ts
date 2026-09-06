import { Router } from 'express';
import {claimHotspot, createHotspot, getHotspots, resolveHotspot} from './hotspot.controller.js';
import {verifyBody} from "../../middleware/validate.js";
import {claimHotspotSchema, createHotspotSchema, resolveHotspotSchema} from "./hotspot.schema.js";

export const hotspotRouter = Router();

hotspotRouter.get('/', getHotspots);
hotspotRouter.post('/', verifyBody(createHotspotSchema), createHotspot);
hotspotRouter.patch('/claim', verifyBody(claimHotspotSchema), claimHotspot);
hotspotRouter.patch('/resolve', verifyBody(resolveHotspotSchema), resolveHotspot);
