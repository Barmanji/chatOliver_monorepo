import express from "express";
import 'dotenv/config'

const app = express();
const port = process.env.PORT;

app.use(express.json());

app.listen(port, () => {
    console.log("Listening on: ", port);
});
