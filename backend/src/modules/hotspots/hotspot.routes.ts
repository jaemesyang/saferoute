import { Router } from 'express';
import {claimHotspot, createHotspot, getHotspots, resolveHotspot} from './hotspot.controller.js';
import {validateBody} from "../../middleware/validate.js";
import {claimHotspotSchema, createHotspotSchema, resolveHotspotSchema} from "./hotspot.schema.js";

export const hotspotRouter = Router();

hotspotRouter.get('/', getHotspots);
hotspotRouter.post('/', validateBody(createHotspotSchema), createHotspot);
hotspotRouter.patch('/:id/claim', validateBody(claimHotspotSchema), claimHotspot);
hotspotRouter.patch('/:id/resolve', validateBody(resolveHotspotSchema), resolveHotspot);
