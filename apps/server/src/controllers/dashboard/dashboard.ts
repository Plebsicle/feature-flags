import express from 'express'
import prisma from "@repo/db"

interface DashboardControllerDependencies {
    prisma: typeof prisma;
}

class DashboardController {
    private prisma: typeof prisma;

    constructor(dependencies: DashboardControllerDependencies) {
        this.prisma = dependencies.prisma;
    }

    private checkUserOrganization = (req: express.Request, res: express.Response): string | null => {
        const userOrganisationId = req.session.user?.userOrganisationId;
        if (!userOrganisationId) {
            res.status(400).json({ success: false, message: "User organisation not found" });
            return null;
        }
        return userOrganisationId;
    };

    private formatRecentActivity = (recentActivityLogs: any[]): any => {
        if (recentActivityLogs.length === 0) {
            return "No recent activity";
        }

        return recentActivityLogs.map(log => {
            // Create a human-readable title based on action and resource type
            const actionMap = {
                CREATE: 'Created',
                UPDATE: 'Updated',
                DELETE: 'Deleted',
                ENABLE: 'Enabled',
                DISABLE: 'Disabled',
                EVALUATE: 'Evaluated',
                ALERT_TRIGGERED: 'Alert Triggered',
                ALERT_ACKNOWLEDGED: 'Alert Acknowledged',
                ALERT_RESOLVED: 'Alert Resolved'
            };

            const resourceMap = {
                FEATURE_FLAG: 'Feature Flag',
                FLAG_ENVIRONMENT: 'Flag Environment',
                FLAG_RULE: 'Flag Rule',
                KILL_SWITCHES: 'Kill Switch',
                METRIC: 'Metric',
                ALERT: 'Alert',
                ORGANIZATION_ATTRIBUTE: 'Organization Attribute',
                FLAG_ROLLOUT: 'Flag Rollout'
            };

            const title = `${resourceMap[log.resource_type as keyof typeof resourceMap] || log.resource_type} ${actionMap[log.action as keyof typeof actionMap] || log.action}`;
            
            // Create description based on available data
            let description = `${log.user?.name || 'Someone'} ${actionMap[log.action as keyof typeof actionMap]?.toLowerCase() || log.action.toLowerCase()} a ${resourceMap[log.resource_type as keyof typeof resourceMap]?.toLowerCase() || log.resource_type.toLowerCase()}`;
            
            // Add more details if attributes were changed
            if (log.attributes_changed && typeof log.attributes_changed === 'object') {
                const changes = Object.keys(log.attributes_changed as object);
                if (changes.length > 0) {
                    description += ` (${changes.join(', ')})`;
                }
            }

            // Calculate time ago
            const now = new Date();
            const logTime = new Date(log.created_at);
            const diffInMs = now.getTime() - logTime.getTime();
            const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
            const diffInHours = Math.floor(diffInMinutes / 60);
            const diffInDays = Math.floor(diffInHours / 24);

            let timestamp;
            if (diffInMinutes < 1) {
                timestamp = "Just now";
            } else if (diffInMinutes < 60) {
                timestamp = `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
            } else if (diffInHours < 24) {
                timestamp = `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
            } else {
                timestamp = `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
            }

            return {
                title,
                description,
                timestamp
            };
        });
    };

    private formatFlagEvaluations = (evaluationCount: number): string => {
        if (evaluationCount === 0) {
            return "No Flags Evaluated";
        }

        // Format large numbers (e.g., 12400 -> "12.4K")
        if (evaluationCount >= 1000000) {
            return `${(evaluationCount / 1000000).toFixed(1)}M`;
        } else if (evaluationCount >= 1000) {
            return `${(evaluationCount / 1000).toFixed(1)}K`;
        } else {
            return evaluationCount.toString();
        }
    };

    private calculateConversionRate = (aggregations: any[]): string => {
        if (aggregations.length === 0 || aggregations.every(agg => !agg.conversions || !agg.encounters)) {
            return "Setup Metrics to see conversion rates";
        }

        const totalConversions = aggregations.reduce((sum, agg) => sum + (agg.conversions || 0), 0);
        const totalEncounters = aggregations.reduce((sum, agg) => sum + (agg.encounters || 0), 0);
        
        if (totalEncounters === 0) {
            return "Setup Metrics to see conversion rates";
        } else {
            const rate = (totalConversions / totalEncounters) * 100;
            return `${rate.toFixed(1)}%`;
        }
    };

    getDashboard = async (req: express.Request, res: express.Response) => {
        try {
            const userOrganisationId = this.checkUserOrganization(req, res);
            if (!userOrganisationId) return;

            console.log(req.session.user);

            // 1. Recent Activity - Latest 5 audit log entries
            const recentActivityLogs = await this.prisma.audit_logs.findMany({
            where: {
                organisation_id: userOrganisationId
            },
            orderBy: {
                created_at: 'desc'
            },
            take: 5,
            select: {
                action: true,
                resource_type: true,
                resource_id: true,
                attributes_changed: true,
                created_at: true,
                user: {
                    select: {
                        name: true
                    }
                }
            }
        });

                    // Format recent activity
            const recentActivity = this.formatRecentActivity(recentActivityLogs);

            // 2. Total Users - Count users in the organization
            const totalUsers = await this.prisma.user_organizations.count({
            where: {
                organization_id: userOrganisationId
            }
        });

            // 3. Flag Evaluations - Get all flags for the org first, then count evaluations
            const orgFlags = await this.prisma.feature_flags.findMany({
                where: {
                    organization_id: userOrganisationId
                },
                select: {
                    id: true
                }
            });

            const flagIds = orgFlags.map((flag: { id: string }) => flag.id);
            let flagEvaluations;
            if (flagIds.length === 0) {
                flagEvaluations = "No Flags Evaluated";
            } else {
                const evaluationCount = await this.prisma.flag_evaluations.count({
                    where: {
                        flag_id: {
                            in: flagIds
                        }
                    }
                });
                console.log(flagEvaluations);
                flagEvaluations = this.formatFlagEvaluations(evaluationCount);
            }

            // 4. Conversion Rate - Get metrics for the organization and calculate overall conversion rate
            const orgMetrics = await this.prisma.metrics.findMany({
                where: {
                    organization_id: userOrganisationId,
                    metric_type: 'CONVERSION'
                },
                select: {
                    id: true
                }
            });

            const metricIds = orgMetrics.map((metric: { id: string }) => metric.id);
            
            let conversionRate;
            if (metricIds.length === 0) {
                conversionRate = "Setup metrics to see conversion rates";
            } else {
                const aggregations = await this.prisma.metric_aggregations.findMany({
                    where: {
                        metric_id: {
                            in: metricIds
                        },
                        conversions: {
                            not: null
                        },
                        encounters: {
                            not: null
                        }
                    },
                    select: {
                        conversions: true,
                        encounters: true
                    }
                });

                conversionRate = this.calculateConversionRate(aggregations);
            }

            const activeFlags = await this.prisma.feature_flags.count({
                where: {
                    organization_id : userOrganisationId,
                    is_active: true
                }
            });
            
            // Return the dashboard data
            res.status(200).json({
                success: true,
                data: {
                    activeFlags,
                    recentActivity,
                    totalUsers,
                    flagEvaluations,
                    conversionRate
                }
            });

        } catch (e) {
            console.error(e);
            res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }
}

// Instantiate and export the controller
import dbInstance from '@repo/db';

const dashboardController = new DashboardController({
    prisma: dbInstance
});

export const getDashboard = dashboardController.getDashboard;