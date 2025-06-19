import express from 'express'
import { getMembers } from '../../controllers/organisation/members';
import { verificationMiddleware } from '../../middlewares/verification';
import { updateRole } from '../../controllers/organisation/updateRole';

const router = express.Router();


router.get('/members', verificationMiddleware ,getMembers);
router.put('/role',verificationMiddleware,updateRole);

export default router;