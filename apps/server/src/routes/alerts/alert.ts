import express from 'express'
import alertReadController from '../../controllers/alerts/read-alert';
import alertCreateController from '../../controllers/alerts/create-alert';
import alertUpdateController from '../../controllers/alerts/update-alert';
import { verificationMiddleware } from '../../middlewares/verification';
import alertDeleteController from '../../controllers/alerts/delete-alert';

const router = express.Router();

router.get('/:metricId', verificationMiddleware, alertReadController.getAlerts);
router.post('/', verificationMiddleware, alertCreateController.createAlert);
router.put('/', verificationMiddleware, alertUpdateController.updateAlert);
router.delete('/:metricId', verificationMiddleware, alertDeleteController.deleteAlert);

export default router;