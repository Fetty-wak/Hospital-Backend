import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app= express();
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000'
}));

app.get('/', (req, res)=>{
    res.send('API is up and running!');
});

//routers import

//routing

export default app;

