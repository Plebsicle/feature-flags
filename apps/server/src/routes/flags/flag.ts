import express from 'express'

const router = express.Router();

import { createFlag } from '../../controllers/crud-flags/create-flag';
import { verificationMiddleware } from '../../middlewares/verification';

// Create Routes
router.post('/createFlag', verificationMiddleware  ,createFlag);

// Update Routes


// Read Routes


// Delete Routes


export default router;