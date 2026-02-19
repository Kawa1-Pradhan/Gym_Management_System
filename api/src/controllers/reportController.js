import reportService from "../services/reportService.js";

const getDailyAttendance = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ message: "Date parameter is required (YYYY-MM-DD)" });
        }
        const data = await reportService.getDailyAttendance(date);
        res.status(200).json(data);
    } catch (error) {
        console.error("Error in getDailyAttendance:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

const getMonthlyAttendance = async (req, res) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) {
            return res.status(400).json({ message: "Month and Year parameters are required" });
        }
        const data = await reportService.getMonthlyAttendance(parseInt(month), parseInt(year));
        res.status(200).json(data);
    } catch (error) {
        console.error("Error in getMonthlyAttendance:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

const getSessionReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ message: "startDate and endDate are required" });
        }
        const data = await reportService.getSessionReports(startDate, endDate);
        res.status(200).json(data);
    } catch (error) {
        console.error("Error in getSessionReport:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

const getRevenueReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ message: "startDate and endDate are required" });
        }
        const data = await reportService.getRevenueReports(startDate, endDate);
        res.status(200).json(data);
    } catch (error) {
        console.error("Error in getRevenueReport:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

const getTopMembersReport = async (req, res) => {
    try {
        const { limit } = req.query;
        const data = await reportService.getTopMembers(limit ? parseInt(limit) : 10);
        res.status(200).json(data);
    } catch (error) {
        console.error("Error in getTopMembersReport:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

export default {
    getDailyAttendance,
    getMonthlyAttendance,
    getSessionReport,
    getRevenueReport,
    getTopMembersReport
};
