import express from 'express'
import fetchAlertsObject from '../../controllers/alert-logs/fetch-alerts';
import { verificationMiddleware } from '../../middlewares/verification';
const router = express.Router();

router.get('/', verificationMiddleware,fetchAlertsObject.fetchAlerts);
router.put('/',verificationMiddleware,fetchAlertsObject.updateAlertStatus);


export default router;