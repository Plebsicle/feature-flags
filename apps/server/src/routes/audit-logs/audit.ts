import express from 'express'
import fetchAuditLogsObject from '../../controllers/audit-logs/audit';
import { verificationMiddleware } from '../../middlewares/verification';

const router = express.Router();

router.get('/', verificationMiddleware,fetchAuditLogsObject.fetchAuditLogs);

export default router;