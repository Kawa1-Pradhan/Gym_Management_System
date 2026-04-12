import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiRequest } from '../utils/api';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState("verifying"); // verifying, success, failed
    const [message, setMessage] = useState("Verifying your payment...");
    const [credentials, setCredentials] = useState(null);

    useEffect(() => {
        const pidx = searchParams.get('pidx');
        if (pidx) {
            verifyPayment(pidx);
        } else {
            setStatus("failed");
            setMessage("Invalid payment link.");
        }
    }, [searchParams]);

    const verifyPayment = async (pidx) => {
        try {
            const response = await apiRequest('/api/membership/verify', {
                method: 'POST   ',
                body: { pidx }
            });
            // apiRequest throws if status >= 400
            setStatus("success");
            setMessage(response.message || "Membership activated successfully!");
            if (response.user) {
                setCredentials(response.user); // Contains name/email. Password sent to email.
            }
        } catch (error) {
            console.error("Verification failed", error);
            setStatus("failed");
            // Extract error message potentially
            const errMsg = error.response ? error.response.data.message : error.message;
            setMessage("Payment verification failed: " + errMsg);
        }
    };

    useEffect(() => {
        if (status === 'success') {
            const timer = setTimeout(() => {
                window.location.href = '/';
            }, 5000); // Redirect after 5 seconds
            return () => clearTimeout(timer);
        }
    }, [status]);

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 p-8 rounded-xl shadow-2xl max-w-md w-full border border-slate-700 text-center">

                {status === 'verifying' && (
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mb-6"></div>
                        <h2 className="text-2xl font-bold text-white mb-2">Processing Payment</h2>
                        <p className="text-gray-400">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <div className="h-16 w-16 bg-green-900/50 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Welcome Aboard!</h2>
                        <p className="text-gray-300 mb-6">{message}</p>

                        {credentials && (
                            <div className="bg-slate-900/50 p-4 rounded-lg mb-6 w-full text-left">
                                <p className="text-sm text-gray-400 mb-2">An email has been sent to <strong>{credentials.email}</strong> with your login credentials.</p>
                                <p className="text-xs text-gray-500 italic">Please check your spam folder.</p>
                            </div>
                        )}

                        <p className="text-cyan-400 text-sm mb-4 animate-pulse">Redirecting to Home in 5 seconds...</p>

                        <Link to="/" className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-lg transition-colors w-full">
                            Return Home Now
                        </Link>
                    </div>
                )}

                {status === 'failed' && (
                    <div className="flex flex-col items-center">
                        <div className="h-16 w-16 bg-red-900/50 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Payment Failed</h2>
                        <p className="text-red-400 mb-6">{message}</p>
                        <Link to="/" className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-lg transition-colors w-full">
                            Return Home
                        </Link>
                    </div>
                )}

            </div>
        </div>
    );
};

export default PaymentSuccess;
