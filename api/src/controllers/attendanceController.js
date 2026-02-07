import attendanceService from "../services/attendanceService.js";

const markAttendance = async (req, res) => {
    try {
        const { memberId } = req.body;
        const markedBy = req.user.id;

        if (!memberId) {
            return res.status(400).json({ message: "Member ID is required" });
        }

        const data = await attendanceService.markAttendance(memberId, markedBy);
        res.status(201).json(data);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
    }
};

const getMyAttendance = async (req, res) => {
    try {
        const memberId = req.user.id;
        const data = await attendanceService.getMemberAttendance(memberId);
        res.status(200).json(data);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
    }
};

const getAttendanceReports = async (req, res) => {
    try {
        const { date, memberId } = req.query;
        const data = await attendanceService.getAllAttendance({ date, memberId });
        res.status(200).json(data);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
    }
};

export default {
    markAttendance,
    getMyAttendance,
    getAttendanceReports
};
