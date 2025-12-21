import express from "express";
import bodyParser from "body-parser";

import config from "./config/config.js";
import authRoutes from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import connectDB from "./config/database.js";

const app = express();

connectDB();


app.use(bodyParser.json());

app.get("/", (req, res)=>{
    res.json({
        name: config.name,
        port: config.port,
        status:"OK",
        version: config.version,
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoute);


app.listen(config.port, ()=>{
    console.log(`Server running at port ${config.port}...`);
});
