import express from 'express'
import alertReadController from '../../controllers/alerts-metrics/read-alert';
import alertCreateController from '../../controllers/alerts-metrics/create-alert';
import alertUpdateController from '../../controllers/alerts-metrics/update-alert';
import { verificationMiddleware } from '../../middlewares/verification';
import alertDeleteController from '../../controllers/alerts-metrics/delete-alert';

const router = express.Router();

router.get('/:metricId', verificationMiddleware, alertReadController.getAlerts);
router.post('/', verificationMiddleware, alertCreateController.createAlert);
router.put('/', verificationMiddleware, alertUpdateController.updateAlert);
router.delete('/:metricId', verificationMiddleware, alertDeleteController.deleteAlert);

export default router;