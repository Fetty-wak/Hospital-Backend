import { PrismaClient } from "@prisma/client";
const prisma= new PrismaClient();
import { generateToken } from "../../utils/tokenGenerator.js";
import bcrypt from 'bcrypt';

export const register=async (req, res)=>{
    //extract common data
    const {fullName, email, password, role}= req.body;

    try{
        //hash password
        const hashed= await bcrypt.hash(password, 10);
        let user;

        //if one operation fails, the whole thing is scrapped. This prevents partial data creation
        await prisma.$transaction(async (tx)=>{
            //store the base data
            user= await tx.user.create({data: {fullName, email, password: hashed, role}})

            //check roles to store extra data
            if (role==='DOCTOR'){
                //extract doctor fields
                const {phoneNumber, licenseNumber, yearsOfExperience, departmentId}= req.body;

                //create doctor
                const doctor= await tx.doctor.create({data: {id: user.id, phoneNumber, licenseNumber, yearsOfExperience,departmentId}});

            }else if(role==='PATIENT'){
                //extract patient fields
                const {address, phoneNumber, allergies, gender, bloodType, dateOfBirth}= req.body;

                //create patient
                const patient= await tx.patient.create({data: {id: user.id, address, phoneNumber, allergies, gender, bloodType, dateOfBirth}});
            }
        });
        
        //generate token
        const token =generateToken(user.id, user.role);

        res.status(201).json({message: 'signup was successful', token, data: {name: user.fullName, email: user.email}});

    }catch(error){
        //log error to the console for dev
        console.error('signup error: ', error);

        res.status(500).json({message: 'signup failed, internal server error'});
    }

}

export const login= async (req, res)=>{
    //grab user info from req.body
    const {email, password}= req.body 

    try{
        //grab passwords from the existing user
        const user= await prisma.user.findUnique({where: {email}});

        //check if user passwords match
        const isMatch= await bcrypt.compare(password, user.password);

        //deny access if not matching
        if(!isMatch) return res.status(401).json({message: 'Invalid login details'});

        //generate token
        const token= generateToken(user.id, user.role);

        res.status(200).json({message: 'login successful', token, data: {name: user.fullName, email}});

    }catch(error){
        //log error to the console for dev
        console.error('login error: ', error);

        res.status(500).json({message: 'login failed, internal server error'});

    }

}