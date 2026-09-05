import { Router } from 'express';
import {createHotspot, getHotspots} from './hotspot.controller.js';
import {validateBody} from "../../middleware/validate.js";
import {createHotspotSchema} from "./hotspot.schema.js";

export const hotspotRouter = Router();

hotspotRouter.get('/', getHotspots);
hotspotRouter.post('/', validateBody(createHotspotSchema), createHotspot);