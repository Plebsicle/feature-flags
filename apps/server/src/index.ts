import * as dotenv from 'dotenv';
dotenv.config();


import express from 'express'
import { Express } from 'express';
import cors from 'cors'
import helmet from 'helmet';
import corsConfiguration from './config/cors';
import { sessionMiddleware } from './middlewares/session';

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
// Health check endpoint
app.get('/health', (req, res) => {
  try {
    // Test that all critical dependencies resolve
    require('express');
    require('@repo/db');
    require('@repo/types/attribute-config');
    
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'bitswitch-server',
      version: process.env.npm_package_version || '1.0.0',
      node_version: process.version,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
        external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100,
        unit: 'MB'
      },
      environment: {
        node_env: process.env.NODE_ENV || 'development',
        database_connected: process.env.DATABASE_URL ? 'configured' : 'not-configured',
        redis_session: process.env.REDIS_SESSION_URL ? 'configured' : 'not-configured',
        redis_flag: process.env.REDIS_FLAG_URL ? 'configured' : 'not-configured'
      },
      dependencies: 'resolved'
    };
    
    res.status(200).json(healthCheck);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'bitswitch-server',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

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

export {app};