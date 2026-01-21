
import authService from "../services/authServices.js";
import {createJWT} from "../utils/jwt.js";


const login = async (req, res)=>{
    const input = req.body;
    try{
        if(!input){
            return res.status(400).send("Required data are missing");
        }
        if(!input.email){
            return res.status(400).send("Email is required");
        }
        if(!input.password){
            return res.status(400).send("Password is required");
        }
        const data = await authService.login(input);

        //generate token
        // FIX: Convert Mongoo  se document to a plain object here
        const payload = data.toObject();
        
        // generate token
        const token = createJWT(payload); 

        res.cookie("token", token, {maxAge:86400 * 1000});


        res.json({ data, token }); // Sending both data and token
        }catch(error){
        res.status(error.statusCode || 500).send(error.message);
    }
};

const register = async (req, res)=>{
    const input = req.body;

    if (!input.password){
        return res.status(400).send("Password is required");
    }
    if (input.password.length < 8){
        return res.status(400).send("Password must be at least 8 characters");
    }
    if (!input.confirmPassword){
        return res.status(400).send("Confirm password is required");
    
    }

    if (input.password !== input.confirmPassword){
        return res.status(400).send("Passwords do not match");
    }

   try{

    const data =  await authService.register(input ); 
    
     //generate token
        // FIX: Convert Mongoo  se document to a plain object here
        const payload = data.toObject();
        
        // generate token
        const token = createJWT(payload); 


        res.cookie("token", token, {maxAge:86400 * 1000});

    res.status(201).send(data);
   }catch(error){ 
    res.status(400).send(error.message);
   }};

export default {register, login};


