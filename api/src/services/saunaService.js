import SaunaSession from "../models/SaunaSession.js";

const getAllSessions = async () => {
    return await SaunaSession.find({})
        .populate("createdBy", "name email")
        .populate("bookings", "name email")
        .sort({ date: 1, startTime: 1 });
};

const createSession = async (data, staffId) => {
    const session = new SaunaSession({
        ...data,
        availableSlots: data.maxCapacity,
        createdBy: staffId,
    });
    await session.save();
    return await session.populate("createdBy", "name email");
};

const updateSession = async (sessionId, updates) => {
    // Don't allow updating createdBy
    const { createdBy, ...validUpdates } = updates;

    const session = await SaunaSession.findByIdAndUpdate(
        sessionId,
        { ...validUpdates, updatedAt: new Date() },
        { new: true }
    ).populate("createdBy", "name email");

    if (!session) {
        throw new Error("Session not found");
    }
    return session;
};

const cancelSession = async (sessionId) => {
    const session = await SaunaSession.findByIdAndUpdate(
        sessionId,
        { status: "Cancelled", updatedAt: new Date() },
        { new: true }
    ).populate("createdBy", "name email");

    if (!session) {
        throw new Error("Session not found");
    }
    return session;
};

const deleteSession = async (sessionId) => {
    const session = await SaunaSession.findByIdAndDelete(sessionId);
    if (!session) {
        throw new Error("Session not found");
    }
    return session;
};

const bookSession = async (sessionId, memberId) => {
    const session = await SaunaSession.findById(sessionId);
    if (!session) {
        throw new Error("Session not found");
    }

    if (session.status !== "Active") {
        throw new Error("Session is not active or has been cancelled");
    }

    if (session.availableSlots <= 0) {
        throw new Error("Session is full");
    }

    // Check if member already booked
    if (session.bookings.includes(memberId)) {
        throw new Error("You have already booked this session");
    }

    session.availableSlots -= 1;
    session.bookings.push(memberId);
    await session.save();

    return await session.populate("bookings", "name email");
};

const cancelBooking = async (sessionId, memberId) => {
    const session = await SaunaSession.findById(sessionId);
    if (!session) {
        throw new Error("Session not found");
    }

    session.availableSlots += 1;
    session.bookings = session.bookings.filter(
        id => id.toString() !== memberId.toString()
    );
    await session.save();
    return session;
};

const getSessionById = async (sessionId) => {
    return await SaunaSession.findById(sessionId)
        .select('name date startTime endTime temperature status');
};

export default {
    getAllSessions,
    getSessionById,
    createSession,
    updateSession,
    cancelSession,
    deleteSession,
    bookSession,
    cancelBooking,
};
