import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    transactionId: {
        type: String, // pidx from Khalti
        required: true,
        unique: true
    },
    amount: {
        type: Number, // In paisa
        required: true
    },
    purchaseOrderId: {
        type: String,
        required: true
    },
    purchaseOrderName: {
        type: String,
        required: true
    },
    customerInfo: {
        name: String,
        email: String,
        phone: String
    },
    status: {
        type: String,
        enum: ["Pending", "Completed", "Expired", "User Canceled"], // "Refunded"
        default: "Pending"
    },
    paymentMethod: {
        type: String, // e.g., "Khalti", "Cash" (for manual enroll)
        default: "Khalti"
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false // Nullable for guest checkouts initially
    },
    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MembershipPlan",
        required: true
    },
    categoryName: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["New", "Renewal"],
        default: "New"
    },
    gatewayResponse: {
        type: Object
    }
}, { timestamps: true });

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
