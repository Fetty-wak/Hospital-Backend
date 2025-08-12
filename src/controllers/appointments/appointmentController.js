import { PrismaClient } from "@prisma/client";
const prisma= new PrismaClient();

export const getAllNotifications= async (req, res)=>{
    //pull all the notifications with logged in user as recipient
    try{
        const userId= req.user.id;
        const notifications= await prisma.notification.findMany({where: {recipientId: userId, isRead: false}});

        if(!notifications) return res.status(400).json({message: 'User has no notifications'});

        res.status(200).json({message: 'notifications successfully retrieved', data: {notifications}});
    }catch(error){
        console.error(`error: `, error);
        res.status(500).json({message: 'unable to get notifications, Internal server error'});
    }

}

export const confirmNotification= async (req, res)=>{
    //toggle individual notifications from unread to read
    try{
        //check if the passed notification Id has the logged in user as the recipient
        const {id}= req.params;
        const userId= req.user.id;

        const appointment= await prisma.notification.findUnique({where: {id}});

        if(!appointment || appointment.recipientId!==userId){
            return res.status(400).json({message: 'unable to retrieve notification, access denied'});
        }

        //otherwise update notification
        const update= await prisma.notification.update({where: {id}, data: {isRead: true}});

        res.status(200).json({message: 'Notification confirmed', data: {update}});

    }catch(error){
        console.error('error: ', error);
        res.status(500).json({message: 'unable to get notification, Internal Server Error'});
    }

}