import {PrismaClient} from '@prisma/client'
const prisma= new PrismaClient();

//a notify util to create a notification
export const notify= async ({type, message, initiatorId, recipientIds, eventId})=>{
    if (!Array.isArray(recipientIds)) recipientIds=[recipientIds];

    const notifications= recipientIds.map(recipientId=>({
            type,
            message,
            initiatorId,
            recipientId,
            eventId,
            status: 'SENT'
        }));

    try{
        const data= await prisma.notification.createMany({data: {notifications}});
        return {success: true,data}

    }catch(error){
        console.error('notification creation error: ', error);

        const failedNotifications= notifications.map(n=>({...n, status: 'FAILED', errorMessage: error.message}));
        await prisma.notification.createMany({data: {failedNotifications}}).catch(err=>console.error('failed to log notifications', err));
        return {success: false, error};
    }
};