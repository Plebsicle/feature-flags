import express from 'express'
import signinController from '../../controllers/auth/signin';
import signupController from '../../controllers/auth/signup';
import emailVerificationController from '../../controllers/auth/email-verify';
import forgotPasswordController from '../../controllers/auth/forgotPassword';
import memberController from '../../controllers/auth/member';
import { verificationMiddleware } from '../../middlewares/verification';
import logoutController from '../../controllers/auth/logout';
import userController from '../../controllers/auth/me';

const router = express.Router();

// Signin Routes
router.post('/emailSignin', signinController.emailSignin);
router.post('/googleSignin', signinController.googleSignin);

// Signup Routes
router.post('/emailSignup', signupController.emailSignup);
router.post('/googleSignup', signupController.googleSignup);

// Verify Email
router.post('/verifyEmailSignup', emailVerificationController.verifyEmailSignup);
router.post('/verifyEmailManual', emailVerificationController.verifyEmailManual);
router.post('/sendVerificationEmailManual', emailVerificationController.sendVerificationEmailManual);

// Forget Password
router.post('/sendVerificationEmailForgetPassword', forgotPasswordController.sendVerificationEmailForgetPassword);
router.post('/checkVerificationEmailForgetPassword', forgotPasswordController.checkVerificationEmailForgetPassword);

// Member Signup
router.post('/memberSignupVerification', memberController.memberSignupVerification);
router.post('/memberSignupSendInvitation', verificationMiddleware, memberController.memberSignupSendInvitation);
router.delete('/member/:userId',verificationMiddleware,memberController.removeMemberFromOrg);

// Logout
router.get('/logout', logoutController.logout);

// User Profile
router.get('/me', verificationMiddleware, userController.getUserData);

export default router;