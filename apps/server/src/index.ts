import * as dotenv from 'dotenv';
dotenv.config();


import express from 'express'
import { Express } from 'express';
import cors from 'cors'
import helmet from 'helmet';
import corsConfiguration from './config/cors';
import { sessionMiddleware } from './middlewares/session';
import { limiter } from './middlewares/rate-limit';

// Route Imports
import authRoutes from './routes/auth/auth'
import flagRoutes from './routes/flags/flag'
import killSwitchRoutes from './routes/kill-switches/switch'
import dashboardRoutes from './routes/dashboard/dashboard'
import organisationRoutes from './routes/organisation/org'
import metricRoutes from './routes/metrics/metrics'
import alertRoutes from './routes/alerts/alert'
import slackRoutes from './routes/slack/slack'
import evaluationRoutes from './routes/evaluation/eval'
import auditLogRoutes from './routes/audit-logs/audit'
import alertLogsRoutes from './routes/alert-logs/alerts'

// Cron Jobs
import aggregateData from './cron-jobs/metric-aggregation';
import alertMonitor from './cron-jobs/send-alert';
import rolloutJob from './cron-jobs/rollout-job';

// Standard Contansts for express application
const app : Express = express();
const PORT : number = parseInt(process.env.PORT!) || 8000;

app.set('trust proxy', 1);

app.use(limiter);


// Standard Starter Middlewares
app.use(cors(corsConfiguration));
app.use(helmet());
app.use(express.json());
app.use(sessionMiddleware);

// Cron Jobs
aggregateData.start();
alertMonitor.start();
rolloutJob.start();

//Routes
app.use('/auth',authRoutes);
app.use('/flag',flagRoutes);
app.use('/killswitch',killSwitchRoutes);
app.use('/dashboard',dashboardRoutes);
app.use('/organisation',organisationRoutes);
app.use('/metrics',metricRoutes);  
app.use('/alerts',alertRoutes);
app.use('/slack',slackRoutes);
app.use('/evaluation',evaluationRoutes);
app.use('/auditLogs',auditLogRoutes);
app.use('/alertLogs',alertLogsRoutes);


//Security Measure
app.disable('x-powered-by');


// Server Started
app.listen(PORT,'0.0.0.0',()=>{
    console.log(`Server Started on PORT ${PORT}`)
});

