import 'dotenv/config'
import express from 'express';
import { hotspotRouter } from './modules/hotspots/hotspot.routes.js';

export const app = express();

app.use(express.json());

app.use('/api/hotspots', hotspotRouter);