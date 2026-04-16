import { lazy, Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { logIn } from "../../../features/actions/auth";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
const ForgotPasswordModal = lazy(() =>
  import("../ForgotPassword/ForgotPassword")
);
import TailwindLoader from "../../../components/TailwindLoader";
import ModalFallback from "../../../components/Fallback/ModalFallback";
function Login() {
  const dispatch = useDispatch();
  const { isLoggingIn, isUserLoggedIn } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [isPasswordHidden, setPasswordHidden] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [openCode, setOpenCode] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const togglePasswordVisibility = () => {
    setPasswordHidden(!isPasswordHidden);
  };

  const onSubmit = (data) => {
    // When the form is submitted, `data` will automatically include `securityCode` if it's visible and registered.
    dispatch(logIn(data)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        if (res.payload?.twoFa) {
          setOpenCode(true); // Show security code input on the next render
        } else {
          // Successful login, clear the 2FA state if it was open
          setOpenCode(false);
        }

        const broadcastChannel = new BroadcastChannel("auth-saas-crm");
        broadcastChannel.postMessage({ type: "REFRESH" });
        broadcastChannel.close();
      }
    });
  };


  useEffect(() => {
    if (isUserLoggedIn) {
      navigate("/", { replace: true });
    }
  }, [isUserLoggedIn, navigate]);

  useEffect(() => {
    document.title = "Signin | Webinar Leads Hub";
  }, []);




// text field
const glassTextFieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "rgba(255,255,255,0.07) !important",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    color: "#ffffff !important",
    height: "52px",
    borderRadius: "12px",
    fontSize: "0.95rem",

    "& fieldset": {
      borderColor: "rgba(255,255,255,0.2) !important",
    },
    "&:hover fieldset": {
      borderColor: "rgba(255,255,255,0.4) !important",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#22B573 !important",
      borderWidth: "1px",
    },
    "& input": {
      backgroundColor: "transparent !important",
      color: "#ffffff !important",
      "&::placeholder": {
        color: "rgba(255,255,255,0.5) !important",
        opacity: 1,
      },
      "&:-webkit-autofill": {
        WebkitBoxShadow: "0 0 0 1000px rgba(10, 30, 34, 0.9) inset !important",
        WebkitTextFillColor: "#ffffff !important",
        transition: "background-color 5000s ease-in-out 0s",
      },
    },
  },
  "& .MuiInputLabel-root": {
    color: "rgba(255,255,255,0.6) !important",
    fontSize: "0.9rem",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#22B573 !important",
  },
  "& .MuiFormHelperText-root": {
    color: "rgba(255,255,255,0.5) !important",
  },
  "& .MuiInputAdornment-root .MuiSvgIcon-root": {
    color: "rgba(255,255,255,0.7) !important",
  },
  "& .MuiIconButton-root": {
    color: "rgba(255,255,255,0.7) !important",
  },
};

  return (
    <div
      className="h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{
        background: "radial-gradient(circle at top right, #0a2e3a, #05161c 60%), linear-gradient(135deg, #05161c 0%, #0a2e3a 50%, #05161c 100%)"
      }}
    >
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
            100% { transform: translateY(0px); }
          }
          @keyframes float-slow {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
            100% { transform: translateY(0px); }
          }
          @keyframes float-lag {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-25px); }
            100% { transform: translateY(0px); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0px); }
          }
          .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
          .animate-slide-up { animation: slideUp 0.6s ease-out forwards; }
          .float1 { animation: float 6s ease-in-out infinite; }
          .float2 { animation: float-lag 8s ease-in-out infinite; }
          .float3 { animation: float-slow 7s ease-in-out infinite; }
          .float4 { animation: float 5.5s ease-in-out infinite; animation-delay: 1s; }
          .float5 { animation: float-lag 9s ease-in-out infinite; animation-delay: 0.5s; }
          .float6 { animation: float-slow 7.5s ease-in-out infinite; animation-delay: 1.5s; }
        `}
      </style>
  <div className="absolute inset-0 pointer-events-none">
    <div
      className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full blur-[150px]"
      style={{ background: "rgba(55,114,121,0.25)" }}
    />
  </div>

  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {/* Side Icons with intensified glows */}
    {/* Top Left - WLH */}
    <div className="absolute top-[20%] -translate-y-1/2 left-[10%] float2">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full bg-blue-400 opacity-60 blur-3xl scale-150"></div>
        <div className="relative z-10 w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)]">
          <img src="/zapier_icon.png" className="w-14 h-14" />
        </div>
      </div>
    </div>

    {/* Middle Left - Pabbly */}
    <div className="absolute top-[50%] -translate-y-1/2 left-[8%] float3 hidden md:block">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full bg-teal-400 opacity-60 blur-3xl scale-150"></div>
        <div className="relative z-10 w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)]">
          <img src="/pabbly_logo.png" className="w-12 h-12" />
        </div>
      </div>
    </div>

    {/* Bottom Left - WhatsApp */}
    <div className="absolute top-[80%] -translate-y-1/2 left-[10%] float1">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full bg-green-400 opacity-60 blur-3xl scale-150"></div>
        <div className="relative z-10 w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)]">
          <img src="/whatsapp_logo.png" className="w-12 h-12" />
        </div>
      </div>
    </div>

    {/* Top Right - Flexifunnel */}
    <div className="absolute top-[20%] -translate-y-1/2 right-[10%] float4">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full bg-green-400 opacity-60 blur-3xl scale-150"></div>
        <div className="relative z-10 w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)]">
          <img src="/flexifunnel.png" className="w-12 h-12" />
        </div>
      </div>
    </div>

    {/* Middle Right - Systeme */}
    <div className="absolute top-[50%] -translate-y-1/2 right-[8%] float5 hidden md:block">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full bg-blue-400 opacity-60 blur-3xl scale-150"></div>
        <div className="relative z-10 w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)]">
          <img src="/Systeme.png" className="w-12 h-12" />
        </div>
      </div>
    </div>

    {/* Bottom Right - Zoom */}
    <div className="absolute top-[80%] -translate-y-1/2 right-[10%] float6">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full bg-blue-500 opacity-60 blur-3xl scale-150"></div>
        <div className="relative z-10 w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)]">
          <img src="/zoom.png" className="w-12 h-12" />
        </div>
      </div>
    </div>
  </div>  

<div className="relative z-10 w-full max-w-md rounded-2xl p-8 pt-10 text-white mx-6 animate-slide-up opacity-0"
  style={{
    background: "rgba(10, 30, 34, 0.45)",
    backdropFilter: "blur(40px) saturate(180%)",
    WebkitBackdropFilter: "blur(40px) saturate(180%)",
    border: "1px solid rgba(255,255,255,0.15)",
    boxShadow: "0 25px 60px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)",
    animationDelay: "0.2s"
  }}
>

  <div
  className="absolute inset-0 pointer-events-none"
  style={{
   background:
  "linear-gradient(120deg, rgba(255,255,255,0.35), rgba(255,255,255,0.08), rgba(255,255,255,0.2))",
opacity: 0.22,
  }}
/>
  
        <div className="flex justify-center mb-6">
          <div className="bg-[#0a1e22] p-2 rounded-lg border border-white/10 shadow-lg">
            <img
              className="w-16 h-16 object-contain"
              src="./wlhLogo.png"
              alt="Webinar Leads Hub"
              fetchpriority="high"
            />
          </div>
        </div>
        {/* Heading */}
        <h1 className="text-center text-3xl font-semibold tracking-wide text-white uppercase">
          WEBINAR LEADS <span className="text-green-400">HUB</span>
        </h1>
        <p className="text-center text-sm text-white/70 mt-3 font-medium">
          Welcome back 👋
        </p>
      
    {/* form */}
          <form
            className="space-y-4 mt-6"
            autoComplete="on"
            onSubmit={handleSubmit(onSubmit)}
          >
            {/* Email */}        
              <TextField
                fullWidth
                label="Email"
                name="email"
                autoComplete="email"
                type="email"
                sx={glassTextFieldSx}
                {...register("email", { required: true })}
                error={!!errors.email}
                helperText={errors.email && "Email is required"}
                disabled={openCode}
                autoFocus
              />
              <TextField
                {...register("password", { required: "Password is required" })}
                fullWidth
                label="Password"
                name="password"
                autoComplete="current-password"
                variant="outlined"
                 sx={glassTextFieldSx}
                // style={{ width: "22rem" }}
                type={isPasswordHidden ? "text" : "password"}
                error={!!errors.password}
                helperText={errors.password?.message}
                disabled={openCode} // Disable when asking for security code
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={togglePasswordVisibility}
                        disabled={openCode}
                      >
                        {isPasswordHidden ? (
                          <VisibilityOffIcon />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            

            {/* Conditionally render the Security Code input field */}
            {openCode && (
              <div className="flex justify-center pt-2">
                <TextField
                  {...register("securityCode", {
                    required: "Security code is required",
                  })}
                  fullWidth
                  label="Security Code"
                  name="securityCode"
                  variant="outlined"
                  sx={glassTextFieldSx}
                  error={!!errors.securityCode}
                  helperText={errors.securityCode?.message}
                  autoFocus
                />
              </div>
            )}

            <div className="flex items-center justify-end pb-2">
              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="text-sm text-white/70 hover:text-white hover:underline transition-colors"
              >
                Forgot your password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-green-500 hover:bg-green-600 active:scale-[0.98] transition-all text-white py-3 rounded-xl font-semibold text-lg shadow-lg shadow-green-900/20"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? <TailwindLoader size={6} /> : "Sign In"}
            </button>

              
           
          </form>

          {forgotModalOpen && (
            <Suspense fallback={<ModalFallback />}>
              <ForgotPasswordModal onClose={() => setForgotModalOpen(false)} />
            </Suspense>
          )}
      
      </div>
      
      
    </div>
  );
}

export default Login;