import jwt from 'jsonwebtoken';
import {PrismaClient} from '@prisma/client';
const prisma= new PrismaClient();

export const protect= async (req, res, next)=>{
    //check for auth header
    const authHeader= req.headers.authorization;

    if(!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({message: 'Access denied, please log in'});

    //extract token
    const token = authHeader.split(' ')[1];

    const decoded= jwt.verify(token, process.env.JWT_SECRET_KEY);

    if(!decoded) return res.status(401).json({success: false, message: 'Access denied, please log in'});

    const user= await prisma.user.findUnique({where: {id: decoded.id}});
    if(!user.isActive) return res.status(403).json({success: false, message: 'Access denied, account is inactive'});

    req.user= decoded;
    next();
}