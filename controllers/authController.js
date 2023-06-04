import { hashPassword } from "../helpers/authHelper.js";
import userModel from "../models/userModel.js";

export const registerController = async (req,res) => {
    try{
        const {name,email,password,phone,address} = req.body;

        if(!name){
            res.send({ error: 'name is required'})
        }
        if(!email){
            res.send({ error: 'email is required'})
        }
        if(!password){
            res.send({ error: 'password is required'})
        }
        if(!phone){
            res.send({ error: 'phone is required'})
        }
        if(!address){
            res.send({ error: 'address is required'})
        }

        //check user
        const existingUser = await userModel.findOne({email});
        //existing user
        if(existingUser){
            return res.status(200).send({
                success:true,
                message:'Already registered email, please login'
            })
        }

        //register user
        const hashedPassword = await hashPassword(password);
        //save
        const user =await new userModel({name,email,phone,address,password:hashedPassword}).save();

        res.status(201).send({
            success:true,
            message: 'user register successfully',
            user,
        });
    }
    catch (error) {
        console.log(error)
        res.status(500).send({
            success:false,
            message:'error in registration',
            error
        });
    }
};