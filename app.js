import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app= express();
app.use(express.json());

//will specify origin later
app.use(cors());

app.get('/', (req, res)=>{
    res.send('API is up and running!');
});

//route protection middleware 
import { protect } from './src/middleware/protector.js';

//routers import
import routers from './src/routes/index.js'

//routing
routers.forEach(({path, route})=>{
    if(path ==='/auth'){
        app.use(`/api${path}`, route);
    }else{
        app.use(`/api/user${path}`, protect, route);
    }
});

export default app;

