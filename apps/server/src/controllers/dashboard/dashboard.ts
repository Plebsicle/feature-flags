import express from 'express'
import prisma from "@repo/db"

export const getDashboard = async (req: express.Request, res: express.Response) => {
    try {
        const userOrganisationId = req.session.user?.userOrganisationId;
        console.log(req.session.user);
        if (!userOrganisationId) {
            res.status(400).json({ success: false, message: "User organisation not found" });
            return;
        }

        // 1. Recent Activity - Latest 5 audit log entries
        const recentActivityLogs = await prisma.audit_logs.findMany({
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
        let recentActivity;
        if (recentActivityLogs.length === 0) {
            recentActivity = "No recent activity";
        } else {
            recentActivity = recentActivityLogs.map(log => {
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

                const resourceMap  = {
                    FEATURE_FLAG: 'Feature Flag',
                    FLAG_ENVIRONMENT: 'Flag Environment',
                    FLAG_RULE: 'Flag Rule',
                    KILL_SWITCHES: 'Kill Switch',
                    METRIC: 'Metric',
                    ALERT: 'Alert',
                    ORGANIZATION_ATTRIBUTE: 'Organization Attribute',
                    FLAG_ROLLOUT: 'Flag Rollout'
                };

                const title = `${resourceMap[log.resource_type as keyof typeof resourceMap ] || log.resource_type} ${actionMap[log.action] || log.action}`;
                
                // Create description based on available data
                let description = `${log.user?.name || 'Someone'} ${actionMap[log.action]?.toLowerCase() || log.action.toLowerCase()} a ${resourceMap[log.resource_type as keyof typeof resourceMap]?.toLowerCase() || log.resource_type.toLowerCase()}`;
                
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
        }

        // 2. Total Users - Count users in the organization
        const totalUsers = await prisma.user_organizations.count({
            where: {
                organization_id: userOrganisationId
            }
        });

        // 3. Flag Evaluations - Get all flags for the org first, then count evaluations
        const orgFlags = await prisma.feature_flags.findMany({
            where: {
                organization_id: userOrganisationId
            },
            select: {
                id: true
            }
        });

        const flagIds = orgFlags.map(flag => flag.id);
        
        let flagEvaluations;
        if (flagIds.length === 0) {
            flagEvaluations = "No Flags Evaluated";
        } else {
            const evaluationCount = await prisma.flag_evaluations.count({
                where: {
                    flag_id: {
                        in: flagIds
                    }
                }
            });

            if (evaluationCount === 0) {
                flagEvaluations = "No FLags Evaluated";
            } else {
                // Format large numbers (e.g., 12400 -> "12.4K")
                if (evaluationCount >= 1000000) {
                    flagEvaluations = `${(evaluationCount / 1000000).toFixed(1)}M`;
                } else if (evaluationCount >= 1000) {
                    flagEvaluations = `${(evaluationCount / 1000).toFixed(1)}K`;
                } else {
                    flagEvaluations = evaluationCount.toString();
                }
            }
        }

        // 4. Conversion Rate - Get metrics for the organization and calculate overall conversion rate
        const orgMetrics = await prisma.metrics.findMany({
            where: {
                organization_id: userOrganisationId,
                metric_type: 'CONVERSION'
            },
            select: {
                id: true
            }
        });

        const metricIds = orgMetrics.map(metric => metric.id);
        
        let conversionRate;
        if (metricIds.length === 0) {
            conversionRate = "Setup Metrics to see conversion rates";
        } else {
            const aggregations = await prisma.metric_aggregations.findMany({
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

            if (aggregations.length === 0 || aggregations.every(agg => !agg.conversions || !agg.encounters)) {
                conversionRate = "Setup Metrics to see conversion rates";
            } else {
                const totalConversions = aggregations.reduce((sum, agg) => sum + (agg.conversions || 0), 0);
                const totalEncounters = aggregations.reduce((sum, agg) => sum + (agg.encounters || 0), 0);
                
                if (totalEncounters === 0) {
                    conversionRate = "Setup Metrics to see conversion rates";
                } else {
                    const rate = (totalConversions / totalEncounters) * 100;
                    conversionRate = `${rate.toFixed(1)}%`;
                }
            }
        }

        const activeFlags = await prisma.feature_flags.count({
            where : {
                is_active : true
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