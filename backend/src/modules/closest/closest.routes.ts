import { Router } from 'express';
import {getClosest} from './closest.controller.js';
import {validateBody} from "../../middleware/validate.js";
import {createHotspotSchema} from "../hotspots/hotspot.schema.js";

export const closestRouter = Router();

closestRouter.get('/', validateBody(createHotspotSchema), getClosest);