import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";
import config from "./config/config.js";
import authRoutes from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import bookingRoute from "./routes/bookingRoute.js";
import sessionRoute from "./routes/sessionRoute.js";
import connectDB from "./config/database.js";
import logger from "./middlewares/logger.js";
import setupDefaultAccounts from "./scripts/setupDefaultAccounts.js";



const app = express();

// Enable CORS for specific origins
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
    credentials: true
}));

connectDB();

// Setup default accounts after database connection
setupDefaultAccounts();

app.use(bodyParser.json());
app.use(cookieParser());

app.use(logger);


app.get("/", (req, res) => {
    res.json({
        name: config.name,
        port: config.port,
        status: "OK",
        version: config.version,
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoute);
app.use("/api/bookings", bookingRoute);
app.use("/api/sessions", sessionRoute);


app.listen(config.port, () => {
    console.log(`Server running at port ${config.port}...`);
});
