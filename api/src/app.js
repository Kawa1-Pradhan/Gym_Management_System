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
import reportRoute from "./routes/reportRoute.js";
import announcementRoute from "./routes/announcementRoute.js";
import connectDB from "./config/database.js";
import logger from "./middlewares/logger.js";
import setupDefaultAccounts from "./scripts/setupDefaultAccounts.js";
import runReminderJobs from "./scripts/reminderJob.js";



const app = express();

// Enable CORS for specific origins
// Enable CORS with support for dynamic origins (DNS/Local IP)
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        // For development, we can allow any origin or use a whitelist
        // The user likely wants their custom DNS/Local IP to work
        callback(null, true);
    },
    credentials: true
}));

// Startup function to ensure sequential execution
const startServer = async () => {
    try {
        await connectDB();

        // Setup default accounts after database connection is established
        await setupDefaultAccounts();

        // Run reminder jobs every minute to support precise session reminders
        runReminderJobs(); // Initial run
        setInterval(runReminderJobs, 60 * 1000);

        app.listen(config.port, () => {
            // console.log(`Server running at port ${config.port}...`);
        });
    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
};

app.use(bodyParser.json());
app.use(cookieParser());
app.use(/uploads/, express.static('public/uploads'));

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
app.use("/api/reports", reportRoute);
app.use("/api/announcements", announcementRoute);

// Start the server
startServer();
