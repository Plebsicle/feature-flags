import express from 'express'
import { createMetric } from '../../controllers/metrics/create-metric';
import { updateMetric } from '../../controllers/metrics/update-metric';
import { getMetricbyId, getMetrics } from '../../controllers/metrics/read-metric';
import { deleteMetric } from '../../controllers/metrics/delete-metric';
import { verificationMiddleware } from '../../middlewares/verification';
import { collectMetric } from '../../controllers/metrics/metric-collection/collect';

const router = express.Router();

router.post('/',verificationMiddleware,createMetric);
router.put('/',verificationMiddleware,updateMetric);
router.get('/',verificationMiddleware,getMetrics);
router.get('/:metricId',verificationMiddleware,getMetricbyId);
router.delete('/:metricId',verificationMiddleware,deleteMetric);


// Metric COllection
router.post('/collect',collectMetric.collectOrganisationMetric);

export default router;