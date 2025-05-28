import express from 'express'
import { Express } from 'express';
import cors from 'cors'
import helmet from 'helmet';
import corsConfiguration from './cors-config/cors';
import { sessionMiddleware } from './middlewares/session';


// Standard Contansts for express application
const app : Express = express();
const PORT : number = parseInt(process.env.PORT!) || 8000;


// Standard Starter Middlewares
app.use(cors(corsConfiguration));
app.use(helmet());
app.use(express.json());
app.use(sessionMiddleware);

//Routes



//Security Measure
app.disable('x-powered-by');


// Server Started
app.listen(PORT,'0.0.0.0',()=>{
    console.log(`Server Started on PORT ${PORT}`)
});

