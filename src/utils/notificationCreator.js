import {PrismaClient} from '@prisma/client'
const prisma= new PrismaClient();

//a notify util to create a notification
export const notify= async ({type, message, initiatorId, recipientId, eventId})=>{
    let result={};
    let success= false;
    let data;
    try{
        data= await prisma.notification.create({data: {type, message, initiatorId, recipientId, eventId}});
        success= true;
        result= {success, data};
        return result;

    }catch(error){
        console.error(`error: `, error);
        result={success, error};
        return result;
    }
}