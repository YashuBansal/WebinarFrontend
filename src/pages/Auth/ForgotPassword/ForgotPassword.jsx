import { useState, useEffect } from "react";
import { errorToast } from "../../../utils/extra";
import { useDispatch, useSelector } from "react-redux";
import { generateOTP, validateOTP } from "../../../features/actions/auth";
import { clearOTPGenerated } from "../../../features/slices/auth";
import TextField from "@mui/material/TextField";
import AppLoader from "../../../components/AppLoader";

const ForgotPasswordModal = ({ onClose }) => {
  const dispatch = useDispatch();

  const { isSomethingStillLoading, isSuccess, isOTPGenerated } = useSelector(
    (state) => state.auth
  );

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const handleSendOtp = () => {
    if (!email.match(/^\S+@\S+\.\S+$/)) {
      errorToast("Please enter a valid email address.");
      return;
    }
    dispatch(generateOTP({ email }));
  };

  // Handle OTP verification
  const handleVerifyOtp = () => {
    dispatch(validateOTP({ email, otp }));
  };

  const handleResendOtp = () => {
    if (canResend) {
      setCanResend(false);
      setResendTimer(60);
    }
  };

  useEffect(() => {
    if (isOTPGenerated) {
      setStep(2);
      setCanResend(false);
      setResendTimer(60);
      dispatch(clearOTPGenerated());

    }
  }, [isOTPGenerated]);

  useEffect(() => {
    if (isSuccess) {
      onClose();
      dispatch(clearOTPGenerated());
    }
  }, [isSuccess]);


  useEffect(() => {
    if (step === 2 && resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
  }, [step, resendTimer]);

  const glassTextFieldSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "rgba(255,255,255,0.07)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      color: "#ffffff",
      height: "52px",
      borderRadius: "12px",
      fontSize: "0.95rem",
      "& fieldset": {
        borderColor: "rgba(255,255,255,0.2)",
      },
      "&:hover fieldset": {
        borderColor: "rgba(255,255,255,0.4)",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#22B573",
        borderWidth: "1px",
      },
    },
    "& .MuiInputLabel-root": {
      color: "rgba(255,255,255,0.6)",
      fontSize: "0.9rem",
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#22B573",
    },
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] backdrop-blur-md bg-black/80 p-4">
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[100px] opacity-20"
          style={{ background: "rgba(55,114,121,1)" }}
        />
      </div>

      <div 
        className="relative w-full max-w-sm rounded-3xl p-8 text-white"
        style={{
          background: "rgba(10, 30, 34, 0.95)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)",
        }}
      >
        <h2 className="text-2xl font-semibold mb-6 text-center tracking-tight uppercase">
          Forgot Password
        </h2>

        {step === 1 ? (
          <div className="space-y-6">
            <TextField
              fullWidth
              label="Enter your email"
              type="email"
              variant="outlined"
              sx={glassTextFieldSx}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            
            <button
              className="w-full bg-green-500 hover:bg-green-600 active:scale-[0.98] transition-all text-white py-3 rounded-xl font-semibold text-lg shadow-lg shadow-green-900/20"
              onClick={handleSendOtp}
              disabled={isSomethingStillLoading}
            >
              {isSomethingStillLoading ? <AppLoader size="md" variant="inverse" /> : "Send OTP"}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <TextField
              fullWidth
              label="Enter OTP"
              variant="outlined"
              sx={glassTextFieldSx}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              autoFocus
            />
            
            <button
              className="w-full bg-green-500 hover:bg-green-600 active:scale-[0.98] transition-all text-white py-3 rounded-xl font-semibold text-lg shadow-lg shadow-green-900/20"
              onClick={handleVerifyOtp}
              disabled={isSomethingStillLoading}
            >
              {isSomethingStillLoading ? <AppLoader size="md" variant="inverse" /> : "Verify OTP"}
            </button>

            {/* Resend OTP Section */}
            <div className="text-center">
              <button
                className={`text-sm tracking-wide transition-colors ${
                  canResend 
                    ? "text-green-400 hover:text-green-300 hover:underline" 
                    : "text-white/40 cursor-not-allowed"
                }`}
                onClick={handleResendOtp}
                disabled={!canResend}
              >
                {canResend ? "Resend OTP" : `Resend in ${resendTimer}s`}
              </button>
            </div>
          </div>
        )}

        <button
          className="w-full mt-6 text-center text-sm text-white/50 hover:text-white transition-colors"
          onClick={onClose}
        >
          Nevermind, I remember it!
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
