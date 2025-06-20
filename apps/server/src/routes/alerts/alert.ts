import express from 'express'
import { getAlerts } from '../../controllers/alerts/read-alert';
import { createAlert } from '../../controllers/alerts/create-alert';
import { updateAlert } from '../../controllers/alerts/update-alert';
import { verificationMiddleware } from '../../middlewares/verification';
import { deleteAlert } from '../../controllers/alerts/delete-alert';

const router = express.Router();

router.get('/', verificationMiddleware,getAlerts);
router.post('/',verificationMiddleware,createAlert);
router.put('/',verificationMiddleware,updateAlert);
router.delete('/',verificationMiddleware,deleteAlert);