import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const KHALTI_URL = "https://dev.khalti.com/api/v2";

export const initiateKhaltiPayment = async (payload) => {
    try {
        const response = await axios.post(
            `${KHALTI_URL}/epayment/initiate/`,
            payload,
            {
                headers: {
                    Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Khalti Initiate Error:", error.response?.data || error.message);
        throw new Error(error.response?.data?.detail || "Failed to initiate payment");
    }
};

export const verifyKhaltiPayment = async (pidx) => {
    try {
        const response = await axios.post(
            `${KHALTI_URL}/epayment/lookup/`,
            { pidx },
            {
                headers: {
                    Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Khalti Verify Error:", error.response?.data || error.message);
        throw new Error("Failed to verify payment");
    }
};
