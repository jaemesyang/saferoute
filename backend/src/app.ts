import 'dotenv/config'
import express from 'express';
import { hotspotRouter } from './modules/hotspots/hotspot.routes.js';
import {closestRouter} from "./modules/closest/closest.routes.js";

export const app = express();

app.use(express.json());

app.use('/api/hotspots', hotspotRouter);
app.use('/api/closest', closestRouter)