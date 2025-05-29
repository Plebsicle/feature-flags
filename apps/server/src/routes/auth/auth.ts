import express from 'express'
import { emailSignin,googleSignin } from '../../controllers/auth/signin';
import { emailSignup,googleSignup } from '../../controllers/auth/signup';
import { sendVerificationEmailManual, verifyEmailManual, verifyEmailSignup } from '../../controllers/auth/email-verify';
import { checkVerificationEmailForgetPassword, sendVerificationEmailForgetPassword } from '../../controllers/auth/forgotPassword';

const router = express.Router();

// Signin Routes
router.post('/emailSignin',emailSignin);
router.post('/googleSignin',googleSignin);

// Signup Routes
router.post('/emailSignup',emailSignup);
router.post('/googleSignup',googleSignup);


// Verify Email
router.post('/verifyEmailSignup',verifyEmailSignup);
router.post('/verifyEmailManual',verifyEmailManual);
router.post('/sendVerificationEmailManual',sendVerificationEmailManual);

// Forget Password
router.post('/sendVerificationEmailForgetPassword',sendVerificationEmailForgetPassword);
router.post('/checkVerificationEmailForgetPassword',checkVerificationEmailForgetPassword);



export default router;