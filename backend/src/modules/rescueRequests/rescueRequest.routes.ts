import {Router} from 'express';
import {arrived, createReport, pickup} from './rescueRequest.controller.js';
import {validateBody} from '../../middleware/validate.js';
import {arrivedSchema, createReportSchema, pickupSchema} from './rescueRequest.schema.js';

export const rescueRequestRouter = Router();

rescueRequestRouter.post('/', validateBody(createReportSchema), createReport);
rescueRequestRouter.post('/arrived', validateBody(arrivedSchema), arrived);
rescueRequestRouter.post('/pickup', validateBody(pickupSchema), pickup);
