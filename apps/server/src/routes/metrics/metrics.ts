import express from 'express'
import { createMetric } from '../../controllers/metrics/create-metric';
import { updateMetric } from '../../controllers/metrics/update-metric';
import { getMetricbyId, getMetrics } from '../../controllers/metrics/read-metric';
import { deleteMetric } from '../../controllers/metrics/delete-metric';
import { verificationMiddleware } from '../../middlewares/verification';

const router = express.Router();

router.post('/',verificationMiddleware,createMetric);
router.put('/',verificationMiddleware,updateMetric);
router.get('/',verificationMiddleware,getMetrics);
router.get('/:metricId',verificationMiddleware,getMetricbyId);
router.delete('/:metricId',verificationMiddleware,deleteMetric);

export default router;