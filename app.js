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

//routers import
import routers from './src/routes/index.js'

//routing
routers.forEach(({path, route})=>{
    app.use(`/api${path}`, route);
});

export default app;

