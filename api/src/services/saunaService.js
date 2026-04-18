import SaunaSession from "../models/SaunaSession.js";

const getAllSessions = async () => {
    // Auto-expire sessions
    const now = new Date();
    const activeSessions = await SaunaSession.find({ status: 'Active' });

    const expiredUpdates = activeSessions
        .filter(session => {
            if (!session.date || !session.endTime) return false;
            try {
                // Construct session end time accurately
                const sessionDate = new Date(session.date);
                const dateStr = sessionDate.toISOString().split('T')[0]; // "YYYY-MM-DD"
                const sessionEnd = new Date(`${dateStr}T${session.endTime}:00`);
                return sessionEnd < now;
            } catch (e) {
                console.error("Error parsing session date for expiration:", e);
                return false;
            }
        })
        .map(session => SaunaSession.findByIdAndUpdate(session._id, { status: 'Expired' }));

    if (expiredUpdates.length > 0) {
        await Promise.all(expiredUpdates);
    }

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
        { returnDocument: 'after' }
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
        { returnDocument: 'after' }
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

    if (session.bookings.length >= session.maxCapacity) {
        throw new Error("Session is full");
    }

    // Uniqueness is enforced by the Booking model index

    session.bookings.push(memberId);
    await session.save();

    return await session.populate("bookings", "name email");
};

const cancelBooking = async (sessionId, memberId) => {
    const session = await SaunaSession.findById(sessionId);
    if (!session) {
        throw new Error("Session not found");
    }

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
