import express from 'express'
import { PrismaClient, rollout_type } from '@repo/db/client'
import cron from 'node-cron'
import prisma from '@repo/db';

// Rollout Configuration Interfaces
interface PercentageRolloutConfig {
  percentage: number;
  startDate: Date;
  endDate: Date;
}

interface ProgressiveRolloutConfig {
  startPercentage: number;
  incrementPercentage: number;
  startDate: Date;
  maxPercentage: number;
  frequency: {
    value: number;
    unit: 'minutes' | 'hours' | 'days';
  };
  currentStage: {
    stage: number;
    percentage: number;
    nextProgressAt?: Date;
  };
}

interface CustomProgressiveRolloutConfig {
  stages: Array<{
    stage: number;
    percentage: number;
    stageDate: Date;
  }>;
  currentStage: {
    stage: number;
    percentage: number;
    nextProgressAt?: Date;
  };
}                        

interface RolloutData {
  id: string;
  flag_environment_id: string;
  type: rollout_type;
  config: any;
  created_at: Date;
  updated_at: Date;
}

class RolloutJob {
    private cronJob : any
    constructor(private prisma : PrismaClient){
        this.prisma = prisma
        this.cronJob = null;
    }
    async start() {
        if (this.cronJob) {
            console.log('Rollout job is already running');
            return;
        }
    
        console.log('Starting rollout management service...');
        console.log('Job will run every 5 minutes (300 seconds) with expression: */5 * * * *');
        
        const cronExpression = '*/5 * * * *';
        this.cronJob = cron.schedule(cronExpression, async () => {
            await this.updateRollout();
        }, {
            timezone: "Asia/Kolkata" 
        });
    
        console.log('Rollout management cron job started');
        
        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log('Shutting down rollout management cron job...');
            await this.stop();
            process.exit(0);
        });
    
        process.on('SIGTERM', async () => {
            console.log('Shutting down rollout management cron job...');
            await this.stop();
            process.exit(0);
        });
    }
    async stop() {
        if (this.cronJob) {
            this.cronJob.destroy();
            this.cronJob = null;
            console.log('Rollout management cron job stopped');
        }
        await this.prisma.$disconnect();
    }

    private async fetchAllRollouts(): Promise<RolloutData[] | false> {
        try {
            const rollouts = await this.prisma.flag_rollout.findMany({
                where: {
                    type: {
                        in: ['PROGRESSIVE_ROLLOUT', 'CUSTOM_PROGRESSIVE_ROLLOUT']
                    },
                    is_finished : false
                }
            });
            
            if (!rollouts) return false;
            return rollouts;
        } catch (e) {
            console.error('Error fetching rollouts:', e);
            return false;
        }
    }

    private calculateNextProgressDate(frequency: { value: number; unit: string }, currentDate: Date): Date {
        const nextDate = new Date(currentDate);
        
        switch (frequency.unit) {
            case 'minutes':
                nextDate.setMinutes(nextDate.getMinutes() + frequency.value);
                break;
            case 'hours':
                nextDate.setHours(nextDate.getHours() + frequency.value);
                break;
            case 'days':
                nextDate.setDate(nextDate.getDate() + frequency.value);
                break;
            default:
                console.warn(`Unknown frequency unit: ${frequency.unit}`);
                return nextDate;
        }
        
        return nextDate;
    }
    //TODO: Cap the next Progress to Max Percentage and mark it as is_finished
    private async updateProgressiveRollout(rollout: RolloutData): Promise<boolean> {
        try {
            const config = rollout.config as ProgressiveRolloutConfig;
            const now = new Date();
            
            // Check if it's time to progress
            if (config.currentStage.nextProgressAt && now < new Date(config.currentStage.nextProgressAt)) {
                return true; // Not time to progress yet
            }
            
            // Check if we've reached max percentage
            if (config.currentStage.percentage >= config.maxPercentage) {
                console.log(`Rollout ${rollout.id} has reached max percentage: ${config.maxPercentage}`);
                return true;
            }
            
            // Calculate next stage
            const nextStage = config.currentStage.stage + 1;
            const nextPercentage = Math.min(
                config.startPercentage + (nextStage * config.incrementPercentage),
                config.maxPercentage
            );
            
            // Calculate next progress date only if we haven't reached max
            const nextProgressAt = nextPercentage < config.maxPercentage 
                ? this.calculateNextProgressDate(config.frequency, now)
                : undefined;
            
            // Update config
            const updatedConfig: ProgressiveRolloutConfig = {
                ...config,
                currentStage: {
                    stage: nextStage,
                    percentage: nextPercentage,
                    nextProgressAt
                }
            };
            
            // Update in database
            await this.prisma.flag_rollout.update({
                where: { id: rollout.id },
                data: {
                    config: updatedConfig as Record<string,any>,
                    updated_at: now
                }
            });
            
            console.log(`Updated progressive rollout ${rollout.id}: Stage ${nextStage}, Percentage ${nextPercentage}%`);
            return true;
            
        } catch (e) {
            console.error(`Error updating progressive rollout ${rollout.id}:`, e);
            return false;
        }
    }

    private async updateCustomProgressiveRollout(rollout: RolloutData): Promise<boolean> {
        try {
            const config = rollout.config as CustomProgressiveRolloutConfig;
            const now = new Date();
            
            // Find the next stage that should be activated
            const currentStageIndex = config.currentStage.stage;
            const nextStageIndex = currentStageIndex + 1;
            
            // Check if there are more stages
            if (nextStageIndex >= config.stages.length) {
                console.log(`Custom rollout ${rollout.id} has completed all stages`);
                return true;
            }
            
            const nextStage = config.stages[nextStageIndex];
            
            // Check if it's time to progress to the next stage
            if (now < new Date(nextStage.stageDate)) {
                return true; // Not time for next stage yet
            }
            
            // Find the stage after next for nextProgressAt calculation
            const stageAfterNext = config.stages[nextStageIndex + 1];
            const nextProgressAt = stageAfterNext ? new Date(stageAfterNext.stageDate) : undefined;
            
            // Update config
            const updatedConfig: CustomProgressiveRolloutConfig = {
                ...config,
                currentStage: {
                    stage: nextStageIndex,
                    percentage: nextStage.percentage,
                    nextProgressAt
                }
            };
            
            // Update in database
            await this.prisma.flag_rollout.update({
                where: { id: rollout.id },
                data: {
                    config: updatedConfig as Record<string,any>,
                    updated_at: now
                }
            });
            
            console.log(`Updated custom rollout ${rollout.id}: Stage ${nextStageIndex}, Percentage ${nextStage.percentage}%`);
            return true;
            
        } catch (e) {
            console.error(`Error updating custom progressive rollout ${rollout.id}:`, e);
            return false;
        }
    }

    updateRollout = async() => {
        try{
            console.log('Starting rollout stage updates...');
            
            // Step 1: Fetch all rollouts
            const allRollouts = await this.fetchAllRollouts();
            if (!allRollouts) {
                console.log('No rollouts found or error fetching rollouts');
                return;
            }
            
            
            const updatePromises = allRollouts.map(async (rollout) => {
                try {
                    if (rollout.type === 'PROGRESSIVE_ROLLOUT') {
                        return await this.updateProgressiveRollout(rollout);
                    } else if (rollout.type === 'CUSTOM_PROGRESSIVE_ROLLOUT') {
                        return await this.updateCustomProgressiveRollout(rollout);
                    }
                    return false;
                } catch (e) {
                    console.error(`Error updating rollout ${rollout.id}:`, e);
                    return false;
                }
            });
            
            const results = await Promise.all(updatePromises);
            const successCount = results.filter(result => result === true).length;
            
            console.log(`Rollout stage updates completed: ${successCount}/${allRollouts.length} successful`);
        }
        catch(e){
            console.error('Error in updateRollout:', e);
        }
    }
}

const rolloutJob = new RolloutJob(prisma);
export default rolloutJob;