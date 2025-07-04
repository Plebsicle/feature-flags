import express from 'express'
import { PrismaClient, user_role } from '@repo/db/client';
import { memberSignupValidation } from '../../util/zod/zod';
import { memberSignupVerificationBodySchema, memberSignupSendInvitationBodySchema } from '../../util/zod/zod';
import { hashPassword } from '../../util/hashing';
import tokenGenerator from '../../util/token';
import { sendMemberSignupMails } from '../../util/mail';

class MemberController {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    private async findValidInvitationToken(token: string) {
        return await this.prisma.invitations.findUnique({
            where: {
                token,
                expires_at: {
                    gte: new Date()
                },
                is_used: false
            }
        });
    }

    private async markTokenAsUsed(token: string) {
        return await this.prisma.invitations.update({
            where: {
                token,
                expires_at: {
                    gte: new Date()
                },
                is_used: false
            },
            data: {
                is_used: true
            }
        });
    }

    private async createMemberUser(email: string, name: string, hashedPassword: string, role: user_role) {
        const isInactiveButPresent = await this.prisma.users.findUnique({
            where : {
                email,
                is_active : false
            }
        });
        if(isInactiveButPresent){
           return this.prisma.users.update({
            where : {
                email,
                is_active : false,
            },
            data : {
                is_active : true,
                name,
                isVerified : true,
                role,
                password : hashedPassword
            },
            select : {
                name : true,
                role : true,
                email : true,
                id : true
            }
           });
        }
        return await this.prisma.users.create({
            data: {
                email,
                name,
                isVerified: true,
                role,
                password: hashedPassword
            },
            select: {
                name: true,
                role: true,
                email: true,
                id: true
            }
        });
    }

    private async createUserOrganizationRelation(memberId: string, organizationId: string, role: user_role) {
        await this.prisma.user_organizations.create({
            data: {
                user_id: memberId,
                organization_id: organizationId,
                role: role
            }
        });
    }

    private async createOwnerMemberRelation(ownerId: string, memberId: string) {
        await this.prisma.owner_members.create({
            data: {
                owner_id: ownerId,
                member_id: memberId,
            }
        });
    }

    private setUserSession(req: express.Request, user: any, organizationId: string) {
        req.session.user = {
            userEmail: user.email,
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            userOrganisationId: organizationId
        };
    }

    private createReturnUser(user: any, orgName: string): { name: string, email: string, id: string, role: user_role, organisationName: string } {
        return {
            name: user.name,
            email: user.email,
            id: user.id,
            role: user.role,
            organisationName: orgName
        };
    }

    private async getUserOrganization(userId: string) {
        return await this.prisma.user_organizations.findUnique({
            where: {
                user_id: userId
            }
        });
    }

    private async checkExistingUsers(emails: string[]) {
        const existingUsers = await this.prisma.users.findMany({
            where: {
                email: {
                    in: emails,
                },
                is_active : true
            },
            select: {
                email: true
            }
        });

        const ineligibleEmails = existingUsers.map(user => user.email);
        const eligibleEmails = emails.filter(email => !ineligibleEmails.includes(email));

        return { ineligibleEmails, eligibleEmails };
    }

    private async createInvitation(email: string, token: string, expiration: Date, userId: string, organizationId: string, memberRole: user_role) {
        await this.prisma.invitations.create({
            data: {
                email,
                expires_at: expiration,
                token,
                invited_by: userId,
                organization_id: organizationId,
                role: memberRole
            }
        });
    }

    memberSignupVerification = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            const parsedBody = memberSignupVerificationBodySchema.parse(req.body);
            req.body = parsedBody;

            const { name, password, token } = req.body;

            const findToken = await this.findValidInvitationToken(token);
            if (!findToken) {
                res.status(401).json("Invalid Token");
                return;
            }

            await this.markTokenAsUsed(token);

            const hashedPassword = await hashPassword(password);
            const member = await this.createMemberUser(findToken.email, name, hashedPassword, findToken.role);

            await this.createUserOrganizationRelation(member.id, findToken.organization_id, member.role);
            await this.createOwnerMemberRelation(findToken.invited_by, member.id);

            const orgData = await this.prisma.organizations.findUnique({
                where: {
                    id: findToken.organization_id
                },
                select: {
                    name: true
                }
            });

            if (!orgData) {
                res.status(400).json({ success: false, message: "No Org" });
                return;
            }

            this.setUserSession(req, member, findToken.organization_id);
            const returnUser = this.createReturnUser(member, orgData.name);

            res.status(200).json({
                success: true,
                message: "Member Signup Succesfull",
                data: returnUser
            });
        }
        catch (e) {
            console.error(e);
            res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    }
    removeMemberFromOrg = async (req : express.Request , res : express.Response)=> {
        try{
            const memberToBeDeleted = req.params.userId;
            const ownerRole = req.session.user?.userRole;
            console.log(ownerRole);
            if(ownerRole === undefined || (ownerRole !== "OWNER")){
                console.log("403 Here");
                res.status(403).json({success : false , message : "Unauthorised"});
                return;
            }
            const ownerId = req.session.user?.userId!;
            if(!memberToBeDeleted){
                res.status(400).json({success : false , message : "No User Found"});
                return;
            }
            const organisationId = req.session.user?.userOrganisationId!;
            const isUserUnderOwner = await this.prisma.owner_members.findUnique({
                where : {
                    owner_id_member_id: {
                        member_id  : memberToBeDeleted,
                        owner_id : ownerId
                    }   
                }
            });
            if(!isUserUnderOwner){
                res.status(403).json({success : false  , message : "Unauthorised"});
                return;
            }
            await this.prisma.users.update({
                where : {
                    id : memberToBeDeleted
                },
                data : {
                    is_active : false
                }
            });
            await this.prisma.owner_members.delete({
                where : {
                    owner_id_member_id : {
                        owner_id : ownerId,
                        member_id : memberToBeDeleted
                    }
                }
            });
            
            await this.prisma.user_organizations.delete({
                where : {
                    organization_id : organisationId,
                    user_id : memberToBeDeleted
                }
            });
            res.status(200).json({success : true , message : "User removed from organisation"});
        }
        catch(e){
            console.error(e);
            res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    }
    memberSignupSendInvitation = async (req: express.Request, res: express.Response) => {
        try {
            // Zod validation
            const parsedBody = memberSignupSendInvitationBodySchema.parse(req.body);
            req.body = parsedBody;

            const role = req.session.user?.userRole;
            if (role !== "OWNER") {
                res.status(401).json("Only Owner Can Invite memebers");
                return;
            }

            const { emails, memberRole } = req.body;
            console.log(emails);
            console.log(memberRole);
            if (!Array.isArray(emails)) {
                res.status(401).json("Invalid Inputs");
                return;
            }

            const userId = req.session.user?.userId;
            if (!userId) {
                res.status(401).json("Unauthorized");
                return;
            }

            const organisationId = req.session.user?.userOrganisationId!;            

            const { ineligibleEmails, eligibleEmails } = await this.checkExistingUsers(emails);

            // Send invitations to eligible emails
            for (const email of eligibleEmails) {
                const token = tokenGenerator();
                const expiration = new Date();
                expiration.setHours(expiration.getHours() + 1);

                await this.createInvitation(email, token, expiration, userId, organisationId, memberRole);
                await sendMemberSignupMails(email, token);
            }

            res.status(200).json({
                success: true,
                message: "Sent Invitation Succesfully",
                data: ineligibleEmails
            });
        } catch (e) {
            console.error(e);
            res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    };
}

// Import the actual prisma instance
import prisma from '@repo/db';
import { tuple } from 'zod';

// Export the instantiated controller
export default new MemberController(prisma);