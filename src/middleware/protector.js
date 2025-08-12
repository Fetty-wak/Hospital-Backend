import jwt from 'jsonwebtoken';

export const protect= (req, res, next)=>{
    //check for auth header
    const authHeader= req.headers.authorization;

    if(!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({message: 'Access denied, please log in'});

    //extract token
    const token = authHeader.split(' ')[1];

    const decoded= jwt.verify(token, process.env.JWT_SECRET_KEY);

    if(!decoded) return res.status(401).json({message: 'access denied, please log in'});

    req.user= decoded;
    next();
}