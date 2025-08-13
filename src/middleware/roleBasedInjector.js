//it checks the role in req.user and fills in the appropite field in req.body 
export const roleInjector=(req, res, next)=>{
    const role= req.user.role;
    const userId= req.user.id;

    if(role==='DOCTOR'){
        req.body.doctorId= userId;
    }else if(role==='PATIENT'){
        req.body.patientId= userId;
    }

    next();
}