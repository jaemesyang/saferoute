import express from 'express';
import { hotspotRouter } from './modules/hotspots/hotspot.routes.js';
import {rescueRequestRouter} from './modules/rescueRequests/rescueRequest.routes.js';

export const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use('/api/hotspots', hotspotRouter);
app.use('/api/reports', rescueRequestRouter)
