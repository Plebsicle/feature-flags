import express from 'express'
import { createKillSwitch } from '../../controllers/kill-switches/create-switch';
import { getAllKillSwitches, getKillSwitchById } from '../../controllers/kill-switches/read-switch';
import { updateKillSwitch } from '../../controllers/kill-switches/update-switch';
import { deleteKillSwitch } from '../../controllers/kill-switches/delete-switch';

const router = express.Router();

router.post('/switch',createKillSwitch);

router.get('/switch/:killSwitchId',getKillSwitchById);
router.get('/switch',getAllKillSwitches);

router.put('/switch',updateKillSwitch);

router.delete('/switch',deleteKillSwitch);