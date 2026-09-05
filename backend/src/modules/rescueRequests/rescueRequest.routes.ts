import {Router} from 'express';
import {createReport} from './rescueRequest.controller.js';
import {validateQuery} from '../../middleware/validate.js';
import {createReportSchema} from './rescueRequest.schema.js';

export const rescueRequestRouter = Router();

rescueRequestRouter.get('/', validateQuery(createReportSchema), createReport);
