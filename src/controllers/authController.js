const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");


const register = async (req, res, next) => {
    try {
        const {
            name,
            email,
            password
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        const existingUser = await User.findOne({
            email
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "learner"
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });
    } catch (error) {
        next(error);
    }
};



const login = async (req , res , next) => {
    try {
        const {
            email,
            password
        } = req.body ;

        if (!email || !password) {
            return res.status(400).json({
                message : "email and password are required"
            });
        }

        const user = await User.findOne ({
            email
        }) ;


        if (!user) {
            return res.status(401).json({
                message : "invalid email or password"
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        ) ;

        if (!isPasswordValid) {
            return res.status(401).json({
                message : "invalid email or password"
            }) ;
        }


        const token = jwt.sign(
            {
                sub: user._id.toString() 
            },

            process.env.JWT_SECRET,

            {
                expiresIn : process.env.JWT_SECRET_IN || "1h"
            }
        );

        res.status(200).json({
            message : "login successful" ,
            token,
            user : {
               id : user._id ,
               name : user.name ,
               email : user.email,
               role : user.role ,
               status : user.status
            }
        });
    } catch (error) {
        next(error) ;
    }
} ;


const getMe = (req, res) => {
    return res.status(200).json({
        user: req.user,
    });
} ;
module.exports = {
    register ,
    login ,
    getMe,
};