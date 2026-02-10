import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";
import config from "./config/config.js";
import authRoutes from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import bookingRoute from "./routes/bookingRoute.js";
import sessionRoute from "./routes/sessionRoute.js";
import inventoryRoute from "./routes/inventoryRoute.js";
import attendanceRoute from "./routes/attendanceRoute.js";
import membershipRoute from "./routes/membershipRoute.js";
import notificationRoute from "./routes/notificationRoute.js";
import connectDB from "./config/database.js";
import logger from "./middlewares/logger.js";
import setupDefaultAccounts from "./scripts/setupDefaultAccounts.js";
import runReminderJobs from "./scripts/reminderJob.js";



const app = express();

// Enable CORS for specific origins
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
    credentials: true
}));

connectDB();

// Setup default accounts after database connection
setupDefaultAccounts();

// Run reminder jobs every hour
runReminderJobs(); // Initial run
setInterval(runReminderJobs, 60 * 60 * 1000);

app.use(bodyParser.json());
app.use(cookieParser());
app.use('/uploads', express.static('public/uploads'));

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
app.use("/api/inventory", inventoryRoute);
app.use("/api/attendance", attendanceRoute);
app.use("/api/membership", membershipRoute);
app.use("/api/notifications", notificationRoute);


app.listen(config.port, () => {
    console.log(`Server running at port ${config.port}...`);
});
