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

// Standard Contansts for express application
const app : Express = express();
const PORT : number = parseInt(process.env.PORT!) || 8000;

app.use(limiter);


// Standard Starter Middlewares
app.use(cors(corsConfiguration));
app.use(helmet());
app.use(express.json());
app.use(sessionMiddleware);

//Routes
app.use('/auth',authRoutes);
app.use('/flag',flagRoutes);
app.use('/killswitch',killSwitchRoutes);
app.use('/dashboard',dashboardRoutes);
app.use('/organisation',organisationRoutes);
app.use('/metrics',metricRoutes);  


//Security Measure
app.disable('x-powered-by');


// Server Started
app.listen(PORT,'0.0.0.0',()=>{
    console.log(`Server Started on PORT ${PORT}`)
});

