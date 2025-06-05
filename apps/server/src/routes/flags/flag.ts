import express from 'express'

const router = express.Router();

import { createFlag } from '../../controllers/crud-flags/create-flag';
import { verificationMiddleware } from '../../middlewares/verification';
import { getAllFeatureFlags,getAuditLogs,getFeatureFlagData,getFlagEnvironmentData,getRollout,getRules } from '../../controllers/crud-flags/read-flag';
import { updateFeatureFlag,updateFlagRollout,updateFlagRule } from '../../controllers/crud-flags/update-flag';
// Create Routes
router.post('/createFlag', verificationMiddleware  ,createFlag);

// Update Routes
router.put('/updateFeatureFlag', verificationMiddleware,updateFeatureFlag);
router.put('/updateFlagRule',  verificationMiddleware  ,updateFlagRule);
router.put('/updateFlagRollout', verificationMiddleware  , updateFlagRollout);

// Read Routes
router.get('/getAllFeatureFlags', verificationMiddleware  ,getAllFeatureFlags);
router.get('/getFeatureFlagData/:flagId', verificationMiddleware  ,getFeatureFlagData);
router.get('/getFlagEnvironmentData/:flagId', verificationMiddleware  ,getFlagEnvironmentData);
router.get('/getRules/:environmentId', verificationMiddleware  ,getRules);
router.get('/getRollout/:environmentId', verificationMiddleware  ,getRollout);
router.get('/getAuditLogs/:flagId', verificationMiddleware  ,getAuditLogs);

// Delete Routes


export default router;