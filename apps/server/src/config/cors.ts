const allowedOrigins : string[] = ['http://localhost:3000' ,process.env.FRONTEND_URL!];

const corsConfiguration = {
    origin : (origin : string | undefined ,callback : (err: Error | null, allow?: boolean) => void ) : void =>{
        if(!origin) return callback(null,true);
        if(allowedOrigins.includes(origin)){
            return callback(null,true);
        }
        else{
            return callback(new Error(`CORS not allowed from this origin`));
        }
    },
    credentials : true
}

export default corsConfiguration;