import express from 'express'
import { createKillSwitch } from '../../controllers/kill-switches/create-switch';
import { getAllKillSwitches, getKillSwitchById } from '../../controllers/kill-switches/read-switch';
import { updateKillSwitch } from '../../controllers/kill-switches/update-switch';
import { deleteKillSwitch } from '../../controllers/kill-switches/delete-switch';

const router = express.Router();

router.post('/',createKillSwitch);

router.get('/:killSwitchId',getKillSwitchById);
router.get('/',getAllKillSwitches);

router.put('/',updateKillSwitch);

router.delete('/:killSwitchId',deleteKillSwitch);

export default router;