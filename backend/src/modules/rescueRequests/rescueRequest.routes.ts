import {Router} from 'express';
import {getClosest} from './rescueRequest.controller.js';
import {validateQuery} from '../../middleware/validate.js';
import {getClosestSchema} from './rescueRequest.schema.js';

export const rescueRequestRouter = Router();

rescueRequestRouter.get('/', validateQuery(getClosestSchema), getClosest);
