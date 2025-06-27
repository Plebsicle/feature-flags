import prisma from '@repo/db'
import cron from 'node-cron'
import { metric_aggregation_method, metric_events, metric_type, metrics, PrismaClient } from '@repo/db/client'

interface AggregationData {
    metric_events : metric_events[],
    id : string,
    organization_id : string,
    metric_name : string,
    metric_key : string,
    metric_type : metric_type,
    is_active : boolean,
    aggregation_window : number,
    unit_measurement : string | null
    aggregation_method : metric_aggregation_method | null
    description : string | null
    tags : string[],
    created_at : Date,
    updated_at : Date
}

class MetricAggregations {
    private cronJob: any;
    private prisma;

    constructor(prisma : PrismaClient){
        this.cronJob = null;
        this.prisma = prisma
    }
     async start() {
        if (this.cronJob) {
          console.log('Alert monitor is already running');
          return;
        }
    
        console.log('Starting alert monitoring service...');
        console.log('Job will run every 5 minutes (300 seconds) with expression: */5 * * * *');
        
        const cronExpression = '*/5 * * * *';
        this.cronJob = cron.schedule(cronExpression, async () => {
          await this.aggregateData();
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
    /*
    Steps :
        1. Query the Metric Table first , get all the active metrics
        2. Get all the information from the metric_events table
        3. Then perform all the necessary action based on 
        metric aggregation method and metric type
        4. Create a new Entry in Metric Aggregation Table
    */
    private async fetchActiveMetrics(){
        try{

            // Step 1 and 2
            const results = await this.prisma.metrics.findMany({
                where : {
                    is_active : true
                },
                include :{
                    metric_events : true
                }
            });
            if(!results) return false;
            return results;
        }
        catch(e){
            console.error(e);
            return false;

        }
    }

   private async aggregateDataFromMetricTypeAndAggregationMethod(metricData: AggregationData[]): Promise<boolean> {
    try {
        const aggregationResults = [];
        const windowStart = new Date();
        for (const metric of metricData) {
            if (!metric.metric_events || metric.metric_events.length === 0) continue;
            const { metric_events, id: metric_id, metric_key, metric_type: type, aggregation_window } = metric;
            

            // Base aggregation object
            const aggregationData: any = {
                metric_id,
                metric_key,
                window_start: windowStart,
                window_end: new Date(),
                total_events: metric_events.length,
                encounters: null,
                conversions: null,
                conversion_rate: null,
                count_total: null,
                numeric_sum: null,
                numeric_avg: null,
                numeric_p50: null,
                numeric_p75: null,
                numeric_p90: null,
                numeric_p95: null,
                numeric_p99: null,
                numeric_min: null,
                numeric_max: null
            };

            switch (type) {
                case 'NUMERIC':
                    const numericValues = metric_events
                        .filter(event => event.event_type === 'NUMERIC_VALUE')
                        .map(event => event.numeric_value)
                        .filter(value => value !== null && value !== undefined) as number[];

                    if (numericValues.length > 0) {
                        const sortedValues = [...numericValues].sort((a, b) => a - b);
                        
                        aggregationData.numeric_sum = numericValues.reduce((sum, val) => sum + val, 0);
                        aggregationData.numeric_avg = aggregationData.numeric_sum / numericValues.length;
                        aggregationData.numeric_min = sortedValues[0];
                        aggregationData.numeric_max = sortedValues[sortedValues.length - 1];
                        aggregationData.numeric_p50 = this.calculatePercentile(sortedValues, 50);
                        aggregationData.numeric_p75 = this.calculatePercentile(sortedValues, 75);
                        aggregationData.numeric_p90 = this.calculatePercentile(sortedValues, 90);
                        aggregationData.numeric_p95 = this.calculatePercentile(sortedValues, 95);
                        aggregationData.numeric_p99 = this.calculatePercentile(sortedValues, 99);
                    }
                    break;

                case 'COUNT':
                    // Count the number of COUNT_INCREMENT events
                    const countEvents = metric_events.filter(event => 
                        event.event_type === 'COUNT_INCREMENT'
                    );
                    aggregationData.count_total = countEvents.length;
                    break;

                case 'CONVERSION':
                    const encounters = metric_events.filter(event => 
                        event.event_type === 'CONVERSION_ENCOUNTER'
                    ).length;
                    
                    const conversions = metric_events.filter(event => 
                        event.event_type === 'CONVERSION_SUCCESS'
                    ).length;

                    aggregationData.encounters = encounters;
                    aggregationData.conversions = conversions;
                    
                    if (encounters > 0) {
                        aggregationData.conversion_rate = (conversions / encounters) * 100;
                    } else {
                        aggregationData.conversion_rate = 0;
                    }
                    break;

                default:
                    console.warn(`Unknown metric type: ${type}`);
                    continue;
            }
            aggregationData.window_end = new Date();
            aggregationResults.push(aggregationData);
        }

        // Insert all aggregation results into the metric_aggregations table
        if (aggregationResults.length > 0) {
            await this.prisma.metric_aggregations.createMany({
                data: aggregationResults,
                skipDuplicates: true // Skip if duplicate window exists
            });
            
            console.log(`Successfully created ${aggregationResults.length} metric aggregation entries`);
        }

        return true;
    } catch (e) {
        console.error('Error in aggregateDataFromMetricTypeAndAggregationMethod:', e);
        return false;
    }
}

// Helper method to calculate percentiles
private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    
    if (Number.isInteger(index)) {
        return sorted[index];
    } else {
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const fraction = index - lower;
        return sorted[lower] * (1 - fraction) + sorted[upper] * fraction;
    }
}
    private async aggregateData(){
        try{
            const aggregationDataFromDB = await this.fetchActiveMetrics();
            if(!aggregationDataFromDB){
                console.error("Aggregation Failed");
                return;
            }
            const result = await this.aggregateDataFromMetricTypeAndAggregationMethod(aggregationDataFromDB);
            if(!result){
                console.error("Aggregation Failed");
                return;
            }
            console.log("Aggregation Succesful");
        }
        catch(e){
            console.error(e);
        }
    
    }
}

const aggregateData = new MetricAggregations(prisma);

console.log('Metric Aggregation cron job is running...');
export default aggregateData;