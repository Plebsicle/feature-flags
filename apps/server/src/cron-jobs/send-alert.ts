import cron from 'node-cron'
import prisma from '@repo/db';
import { PrismaClient, alert_operator, metric_aggregations, metric_type, user_role, metric_aggregation_method } from '@repo/db/client';
import { WebClient } from '@slack/web-api';
import { sendEmailAlert } from '../util/mail';

interface alertMessage {
    flag_name: string;
    flag_key: string;
    environment_name: string;
    metric_name: string;
    metric_key: string;
    metric_type: metric_type;
    threshold_value: number;
    current_value: number;
    operator: alert_operator;
    organization_name: string;
    timestamp: string;
    organization_id : string,
    recipients : user_role[]
}


class AlertMonitor {
  private cronJob: any;
  private prisma: PrismaClient;
  private WebClient : any;

  constructor(WebClient : any,prisma : PrismaClient) {
    this.cronJob = null;
    this.prisma = prisma;
    this.WebClient = WebClient
  }

  async start() {
    if (this.cronJob) {
      console.log('Alert monitor is already running');
      return;
    }

    console.log('Starting alert monitoring service...');
    console.log('Job will run every 5 minutes (300 seconds) with expression: */5 * * * *');
    
    const cronExpression = '2-59/5 * * * *';
    this.cronJob = cron.schedule(cronExpression, async () => {
      await this.processAlerts();
    }, {
      timezone: "Asia/Kolkata" 
    });

    console.log('Alert monitoring cron job started');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down alert monitoring cron job...');
      await this.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('Shutting down alert monitoring cron job...');
      await this.stop();
      process.exit(0);
    });
  }

  async stop() {
    if (this.cronJob) {
      this.cronJob.destroy();
      this.cronJob = null;
      console.log('Alert monitoring cron job stopped');
    }
    await this.prisma.$disconnect();
  }

  private createAlertMessage(payload: Omit<alertMessage,"recipients">){
    const message = `🚨 *Alert Triggered!*
        *Flag:* ${payload.flag_name} (\`${payload.flag_key}\`)
        *Environment:* ${payload.environment_name}
        *Metric:* ${payload.metric_name} (\`${payload.metric_key}\`)
        *Type:* ${payload.metric_type}
        *Threshold:* ${payload.operator} ${payload.threshold_value}
        *Current Value:* ${payload.current_value}
        *Organization:* ${payload.organization_name}
        *Time:* ${new Date(payload.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
        `
      return message;
  }

  // Placeholder utility methods for sending alerts
  private async sendSlackAlert(payload : Omit<alertMessage,"recipients">) {
    try{
        const organisationId = payload.organization_id;
        const integration = await this.prisma.slackIntegration.findFirst({
        where: {
          organisation_id: organisationId,
          is_active: true,
        },
        include: {
          channels: true,
        },
      });

      if (!integration) {
        throw new Error('No active Slack integration found');
      }

      const client = new this.WebClient(integration.bot_token);

      const channels = integration.channels;

      const results = [];

      const message = this.createAlertMessage(payload);

      for (const channel of channels) {
        try {
          const result = await client.chat.postMessage({
            channel: channel.channel_id,
            text: message,
            username: 'BitSwitch-FlagManager', 
          });
          results.push({ channel: channel.channel_id, success: true, result });
        } catch (error) {
          console.error(`Failed to send message to ${channel.channel_id}:`, error);
          results.push({ channel: channel.channel_id, success: false, error });
        }
      }

      return results;
    }
    catch(e){
      console.error(e);
      return;
    }
  }

  private async sendEmailAlert(payload : alertMessage) {
    try{
        const userRoles = payload.recipients;
        const organisationId = payload.organization_id;
        const usersFromOrganisation =  await this.prisma.user_organizations.findMany({
          where : {
            role : {
              in : userRoles
            },
            organization_id : organisationId
          },include : {
            user : true
          }
        });
        for(const user of usersFromOrganisation){
          const {recipients , ...updatedPayloadForMessage} = payload;
          const message = this.createAlertMessage(updatedPayloadForMessage);
          sendEmailAlert(user.user.email,message,payload.organization_name);
        }
    }
    catch(e){
      console.error(e);
      return;
    }
  }

  // Helper method to evaluate threshold based on operator
  private evaluateThreshold(currentValue : number, threshold : number, operator : alert_operator ) {
    switch (operator) {
      case 'EQUALS_TO':
        return currentValue === threshold;
      case 'GREATER_THAN':
        return currentValue > threshold;
      case 'LESS_THAN':
        return currentValue < threshold;
      default:
        return false;
    }
  }

  // Helper method to get the relevant metric value based on metric type
  private getMetricValue(aggregation : metric_aggregations, metricType : metric_type,metric_aggregation? : metric_aggregation_method) {
    switch (metricType) {
      case 'COUNT':
        return aggregation.count_total;
      case 'NUMERIC':
        switch(metric_aggregation){
          case 'AVERAGE':
            return aggregation.numeric_avg;
          case 'P50':
            return aggregation.numeric_p50
          case 'P75':
            return aggregation.numeric_p75
          case 'P90' :
            return aggregation.numeric_p90
          case "P95" :
            return aggregation.numeric_p95
          case "P99":
            return aggregation.numeric_p99
          case "SUM":
            return aggregation.numeric_sum
          default:
            return aggregation.numeric_avg
        } 
      case 'CONVERSION':
        return aggregation.conversion_rate;
      default:
        return null;
    }
  }

  // Main alert monitoring method
  private async processAlerts() {
    try {
      console.log(`[${new Date().toISOString()}] Starting alert monitoring process...`);
      
      // Step 1: Fetch active metrics with related data
      const activeMetrics = await this.prisma.metrics.findMany({
        where: {
          is_active: true
        },
        include: {
          metric_setup: true, // This is the alert_metric relation
          organization: {
            include: {
              alert_preferences: true
            }
          },
          flag_environment: {
            include: {
              flag: true
            }
          },
          metric_aggregations: {
            orderBy: {
              window_end: 'desc'
            },
            take: 1 // Get the most recent aggregation
          }
        }
      });
      
      console.log(`Found ${activeMetrics.length} active metrics to process`);
      
      for (const metric of activeMetrics) {
        try {

          const existingAlert = await this.prisma.triggered_alerts.findFirst({ // skip sending alert if already triggered
            where : {
              metric_id : metric.id,
              alert_status : "TRIGGERED"
            }
          });
          if(existingAlert){
            continue;
          }
          // Step 2: Check if alerts are enabled for this metric
          if (!metric.metric_setup || !metric.metric_setup.is_enabled) {
            console.log(`Skipping metric ${metric.metric_key} - alerts not enabled`);
            continue;
          }
          
          // Step 3: Get alert preferences
          const alertPreferences = metric.organization.alert_preferences;
          if (!alertPreferences) {
            console.log(`Skipping metric ${metric.metric_key} - no alert preferences configured`);
            continue;
          }
          
          // Check if at least one alert method is enabled
          if (!alertPreferences.email_enabled && !alertPreferences.slack_enabled) {
            console.log(`Skipping metric ${metric.metric_key} - no alert methods enabled`);
            continue;
          }
          
          // Step 4: Get latest metric aggregation
          const latestAggregation = metric.metric_aggregations[0];
          if (!latestAggregation) {
            console.log(`Skipping metric ${metric.metric_key} - no aggregation data available`);
            continue;
          }
          
          // Step 5: Evaluate threshold
          const { threshold, operator } = metric.metric_setup;
          const currentValue = this.getMetricValue(latestAggregation, metric.metric_type,metric.aggregation_method ? metric.aggregation_method : undefined);
          
          if (currentValue === null || currentValue === undefined) {
            console.log(`Skipping metric ${metric.metric_key} - no valid metric value`);
            continue;
          }
          
          const thresholdCrossed = this.evaluateThreshold(currentValue, threshold, operator);
          
          if (!thresholdCrossed) {
            console.log(`Metric ${metric.metric_key} within threshold: ${currentValue} ${operator} ${threshold}`);
            continue;
          }
          
          console.log(`Threshold crossed for metric ${metric.metric_key}: ${currentValue} ${operator} ${threshold}`);
          
          // Step 6: Prepare alert payload
          const alertPayload = {
            flag_name: metric.flag_environment?.flag?.name || 'Unknown Flag',
            flag_key: metric.flag_environment?.flag?.key || 'unknown-flag',
            environment_name: metric.flag_environment?.environment || 'unknown',
            metric_name: metric.metric_name,
            metric_key: metric.metric_key,
            metric_type: metric.metric_type,
            threshold_value: threshold,
            current_value: currentValue,
            operator: operator,
            organization_name: metric.organization.name,
            timestamp: new Date().toISOString()
          };
          
          // Step 7: Send alerts based on preferences (send to whichever channel is enabled)
          const alertPromises = [];
          
          if (alertPreferences.email_enabled) {
            console.log(`Sending email alert for metric ${metric.metric_key}`);
            alertPromises.push(this.sendEmailAlert({
              ...alertPayload,
              recipients: alertPreferences.email_roles_notification,
              organization_id: metric.organization_id
            }));
          }
          
          if (alertPreferences.slack_enabled) {
            console.log(`Sending Slack alert for metric ${metric.metric_key}`);
            alertPromises.push(this.sendSlackAlert({
              ...alertPayload,
              organization_id: metric.organization_id
            }));
          }
          
          // Wait for all alert sends to complete
          await Promise.allSettled(alertPromises);
          
          // Step 8: Log triggered alert
          await this.prisma.triggered_alerts.create({
            data: {
              metric_id: metric.id,
              current_value: currentValue,
              threshold_value: threshold,
              alert_status: 'TRIGGERED'
            }
          });
          
          console.log(`Alert triggered and logged for metric ${metric.metric_key}`);
          
        } catch (error) {
          console.error(`Error processing metric ${metric.metric_key}:`, error);
          // Continue processing other metrics even if one fails
        }
      }
      
      console.log(`[${new Date().toISOString()}] Alert monitoring process completed`);
      
    } catch (error) {
      console.error('Error in alert monitoring process:', error);
    }
  }

  // Optional method to run alert processing immediately for testing
  async runOnce() {
    await this.processAlerts();
  }
}

// Create and start the alert monitor
const alertMonitor = new AlertMonitor(WebClient,prisma);

console.log('Alert monitoring cron job is running...');

export default alertMonitor;