import dotenv from "dotenv";
import mongoose from "mongoose";
import { DB_NAME } from "../constants";
import logger from "../logger/winston.logger.js";
dotenv.config({ path: "./.env" });

const connectDB = async () => {
    try {
        console.log(`${process.env.MONGODB_LOCAL_URI}/${DB_NAME}`)
        const mongooseInstance = await mongoose.connect(
            `${process.env.MONGODB_LOCAL_URI}/${DB_NAME}`,
        );
        console.log(
            `\n MONGO DB IS CONNECTED || DB HOST: ${mongooseInstance.connection.host}, PORT: ${process.env.PORT}`,
        );
    } catch (error) {
        logger.error("MongoDB connection error: ", error);
        process.exit(1);
    }
};

export default connectDB;
