import express from 'express'
import { deleteIntegration, getChannels, getIntegration, saveChannels, slackOauthCallback, slackOauthUrl } from '../../controllers/slack/slack';
import { verificationMiddleware } from '../../middlewares/verification';

const router = express.Router();

router.get('/auth/url',verificationMiddleware, slackOauthUrl);

router.get('/oauth/callback',slackOauthCallback);

router.get('/integration',verificationMiddleware,getIntegration);

router.get('/channels/:teamId',verificationMiddleware,getChannels);

router.post('/channels/:integrationId',verificationMiddleware,saveChannels);

router.delete('/integration',verificationMiddleware,deleteIntegration);

export default router;