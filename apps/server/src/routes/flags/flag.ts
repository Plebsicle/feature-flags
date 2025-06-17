import express from 'express'

const router = express.Router();

import { createEnvironment, createFlag } from '../../controllers/crud-flags/create-flag';
import { verificationMiddleware } from '../../middlewares/verification';
import { getAllFeatureFlags,getAuditLogs,getFeatureFlagData,getFlagEnvironmentData,getRollout,getRules } from '../../controllers/crud-flags/read-flag';
import { updateEnvironment, updateFeatureFlag,updateFlagRollout,updateFlagRule } from '../../controllers/crud-flags/update-flag';
import { deleteEnvironment, deleteFeatureFlag, deleteRule } from '../../controllers/crud-flags/delete-flag';
// Create Routes
router.post('/createFlag', verificationMiddleware  ,createFlag); // -> Done
router.post('/createEnvironment',verificationMiddleware,createEnvironment);

// Update Routes
router.put('/updateFeatureFlag', verificationMiddleware,updateFeatureFlag); // -> Done
router.put('/updateFlagRule',  verificationMiddleware  ,updateFlagRule); // -> Done
router.put('/updateFlagRollout', verificationMiddleware  , updateFlagRollout); // -> Done
router.put('/updateEnvironment',verificationMiddleware,updateEnvironment);

// Read Routes
router.get('/getAllFeatureFlags', verificationMiddleware  ,getAllFeatureFlags); // -> Done
router.get('/getFeatureFlagData/:flagId', verificationMiddleware  ,getFeatureFlagData); // -> Done
router.get('/getFlagEnvironmentData/:flagId', verificationMiddleware  ,getFlagEnvironmentData); //->Done
router.get('/getRules/:environmentId', verificationMiddleware  ,getRules);//->Done
router.get('/getRollout/:environmentId', verificationMiddleware  ,getRollout);//->Done
router.get('/getAuditLogs/:flagId', verificationMiddleware  ,getAuditLogs);//->Done

// Delete Routes
router.delete('/deleteFeatureFlag/:flagId',deleteFeatureFlag);
router.delete('/deleteEnvironment/:environmentId',deleteEnvironment);
router.delete('/deleteRule/:ruleId',deleteRule);

export default router;