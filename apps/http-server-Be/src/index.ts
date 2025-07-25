import dotenv from "dotenv";
import connectDB from "./config/db";
import { app } from "./app";

dotenv.config({ path: "./.env" });

connectDB()
    .then(() => {
        app.on("error", (error)=> {
            console.log('ERROR: ', error);
            throw error
        });
        app.listen(process.env.PORT || 3000, ()=> {
            console.log(`Server is running at port ${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.log(`error in connection DB`, err);
    })
