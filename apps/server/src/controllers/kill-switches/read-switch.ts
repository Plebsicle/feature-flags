import express from 'express'
import prisma from '@repo/db';

export const getAllKillSwitches = async (req: express.Request, res: express.Response) => {
    try {
        const organisation_id = req.session.user?.userOrganisationId!;
        
        // Optional query parameters for filtering
        const { is_active, page = 1, limit = 10 } = req.query;
        
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Build where clause
        const whereClause: any = {
            organization_id: organisation_id
        };

        if (is_active !== undefined) {
            whereClause.is_active = is_active === 'true';
        }

        // Get kill switches with related data
        const [killSwitches, totalCount] = await Promise.all([
            prisma.kill_switches.findMany({
                where: whereClause,
                include: {
                    creator: {
                        select: {
                            id: true,
                            email: true,
                            name: true
                        }
                    },
                    activator: {
                        select: {
                            id: true,
                            email: true,
                            name: true
                        }
                    },
                    flag_mappings: {
                        include: {
                            flag: {
                                select: {
                                    id: true,
                                    name: true,
                                    key: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    created_at: 'desc'
                },
                skip,
                take: limitNum
            }),
            prisma.kill_switches.count({
                where: whereClause
            })
        ]);

        res.status(200).json({
            success: true,
            data: {
                killSwitches,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalCount / limitNum),
                    totalCount,
                    hasNext: pageNum * limitNum < totalCount,
                    hasPrevious: pageNum > 1
                }
            }
        });

    } catch (error) {
        console.error('Error fetching kill switches:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal Server Error"
        });
    }
};

// Get Specific Kill Switch by ID
export const getKillSwitchById = async (req: express.Request, res: express.Response) => {
    try {
        const killSwitchId = req.params.killSwitchId;
        
        if (!killSwitchId) {
            return res.status(400).json({
                success: false,
                message: "Kill switch ID is required"
            });
        }

        const organisation_id = req.session.user?.userOrganisationId!;

        const killSwitch = await prisma.kill_switches.findUnique({
            where: {
                id: killSwitchId,
                organization_id: organisation_id
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        email: true,
                        name: true
                    }
                },
                activator: {
                    select: {
                        id: true,
                        email: true,
                        name: true
                    }
                },
                flag_mappings: {
                    include: {
                        flag: {
                            select: {
                                id: true,
                                name: true,
                                key: true,
                                description: true,
                                is_active: true
                            }
                        }
                    },
                    orderBy: {
                        created_at: 'asc'
                    }
                }
            }
        });

        if (!killSwitch) {
            return res.status(404).json({
                success: false,
                message: "Kill switch not found or access denied"
            });
        }

        res.status(200).json({
            success: true,
            data: killSwitch
        });

    } catch (error) {
        console.error('Error fetching kill switch:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal Server Error"
        });
    }
};