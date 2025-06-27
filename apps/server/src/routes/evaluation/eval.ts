import express from 'express'

import { featureFlagController } from '../../controllers/evaluation';

const router = express.Router();

router.post('/',featureFlagController.evaluateFeatureFlag);

export default router;