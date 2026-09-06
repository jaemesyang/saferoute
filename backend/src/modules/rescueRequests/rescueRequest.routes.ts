import {Router} from 'express';
import {createReport} from './rescueRequest.controller.js';
import {validateBody} from '../../middleware/validate.js';
import {createReportSchema} from './rescueRequest.schema.js';

export const rescueRequestRouter = Router();

rescueRequestRouter.post('/', validateBody(createReportSchema), createReport);
