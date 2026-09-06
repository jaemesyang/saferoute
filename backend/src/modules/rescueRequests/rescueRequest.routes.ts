import {Router} from 'express';
import {arrived, createReport, getStatus, pickup} from './rescueRequest.controller.js';
import {verifyBody} from '../../middleware/validate.js';
import {arrivedSchema, createReportSchema, pickupSchema} from './rescueRequest.schema.js';

export const rescueRequestRouter = Router();

rescueRequestRouter.post('/', verifyBody(createReportSchema), createReport);
rescueRequestRouter.post('/status', verifyBody(pickupSchema), getStatus);
rescueRequestRouter.post('/arrived', verifyBody(arrivedSchema), arrived);
rescueRequestRouter.post('/pickup', verifyBody(pickupSchema), pickup);
