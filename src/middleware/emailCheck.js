import {PrismaClient} from '@prisma/client'
const prisma= new PrismaClient();

export const emailExists= (condition)=>{
    return async (req, res, next)=>{
        //query the db to see it the email is already in use
        const email= req.body.email;
        const exists= await prisma.user.findUnique({where: {email}});

        //check if it matches the condition passed
        if(Boolean(exists)!==condition){
            return res.status(400).json({message: 'check your credentials'});
        }

        //otherwise proceed
        next();
    }
}