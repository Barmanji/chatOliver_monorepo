import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
// Desc: Database connection Dick way
// const mongoose = require('mongoose');
// mongoose.connect('mongodb://127.0.0.1:27017/test');
//
// DB conn Mentoss way ;-)
const connectDB = async () => {
    try {
        const mongooseInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MONGO DB IS CONNECTED || DB HOST: ${mongooseInstance.connection.host}`)
    }
    catch(error){
        console.log("MongoDB Connection error",error);
        process.exit(1);
    }
}

export default connectDB;

