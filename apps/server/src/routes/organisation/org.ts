import express from 'express'
import { getMembers } from '../../controllers/organisation/members';
import { verificationMiddleware } from '../../middlewares/verification';
import { updateRole } from '../../controllers/organisation/updateRole';
import { getAlertPreferences, orgAlertPreferences, updatePreferences } from '../../controllers/organisation/alert-preferences';

const router = express.Router();


router.get('/members', verificationMiddleware ,getMembers);
router.put('/role',verificationMiddleware,updateRole);


router.get('/preferences',verificationMiddleware,getAlertPreferences);
router.post('/preferences',verificationMiddleware,orgAlertPreferences);
router.put('/preferences',verificationMiddleware,updatePreferences);

export default router;