import BoxingSession from "../models/BoxingSession.js";

const getAllSessions = async () => {
    // Auto-expire sessions
    const now = new Date();
    const activeSessions = await BoxingSession.find({ status: 'Active' });

    const expiredUpdates = activeSessions
        .filter(session => {
            if (!session.date || !session.endTime) return false;
            const [hours, minutes] = session.endTime.split(':');
            const sessionEnd = new Date(session.date);
            sessionEnd.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            return sessionEnd < now;
        })
        .map(session => BoxingSession.findByIdAndUpdate(session._id, { status: 'Expired' }));

    if (expiredUpdates.length > 0) {
        await Promise.all(expiredUpdates);
    }

    return await BoxingSession.find({})
        .populate("createdBy", "name email")
        .populate("bookings", "name email")
        .sort({ date: 1, startTime: 1 });
};

const createSession = async (data, staffId) => {
    const session = new BoxingSession({
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

    const session = await BoxingSession.findByIdAndUpdate(
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
    const session = await BoxingSession.findByIdAndUpdate(
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
    const session = await BoxingSession.findByIdAndDelete(sessionId);
    if (!session) {
        throw new Error("Session not found");
    }
    return session;
};

const cancelBooking = async (sessionId, memberId) => {
    const session = await BoxingSession.findById(sessionId);
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

const bookSession = async (sessionId, memberId) => {
    const session = await BoxingSession.findById(sessionId);
    if (!session) {
        throw new Error("Session not found");
    }

    if (session.status !== "Active") {
        throw new Error("Session is not active or has been cancelled");
    }

    if (session.availableSlots <= 0) {
        throw new Error("Session is full");
    }

    // Uniqueness is enforced by the Booking model index (allows re-booking after cancel)

    session.availableSlots -= 1;
    session.bookings.push(memberId);
    await session.save();

    return await session.populate("bookings", "name email");
};

const getSessionById = async (sessionId) => {
    return await BoxingSession.findById(sessionId)
        .select('name instructor date startTime endTime status');
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
