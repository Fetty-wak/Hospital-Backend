import jwt from 'jsonwebtoken';

export const generateToken= ({id, role, fullName})=>{
    return jwt.sign({id, role, fullName}, process.env.JWT_SECRET_KEY, {expiresIn: process.env.JWT_EXPIRY});
}