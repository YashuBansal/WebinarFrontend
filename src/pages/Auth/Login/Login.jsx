import { lazy, Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { logIn } from "../../../features/actions/auth";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";

import { getGlobalData } from "../../../features/actions/globalData";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
const ForgotPasswordModal = lazy(() =>
  import("../ForgotPassword/ForgotPassword")
);
import TailwindLoader from "../../../components/TailwindLoader";
import ModalFallback from "../../../components/Fallback/ModalFallback";
import { globalButton } from "../../../utils/style";

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

  return (
    <div className="h-screen w-full bg-[#F3F4F6]">
      {/* Left Section */}
      <div className="w-full bg-[#F3F4F6]">
        {/* Video/Banner Section */}
        <img
          className="hidden md:block w-full h-full object-cover"
          src="./logo.png"
          alt="Banner"
          loading="lazy"
        />

        <img
          className="block md:hidden w-full pt-4 h-[400px] object-contain"
          src="./smlogo.png"
          alt="Mobile Banner"
          loading="lazy"
        />
      </div>

      {/* Right Section - Login Form */}
      <div className="flex items-center justify-center w-full bg-[#F3F4F6] p-2">
        <div className=" w-full">
          <form
            className="space-y-2"
            autoComplete="on"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="flex md:flex-row flex-col items-center gap-4 md:gap-10 justify-center">
              <TextField
                fullWidth
                label="Email"
                name="email"
                autoComplete="email"
                variant="outlined"
                type="email"
                style={{ width: "22rem" }}
                className="bg-gray-50"
                {...register("email", { required: true })}
                error={!!errors.email}
                helperText={errors.email && "Email is required"}
                disabled={openCode} // Disable when asking for security code
              />

              <TextField
                {...register("password", { required: "Password is required" })}
                fullWidth
                label="Password"
                name="password"
                autoComplete="current-password"
                variant="outlined"
                style={{ width: "22rem" }}
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
            </div>

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
                  style={{ width: "24rem" }}
                  error={!!errors.securityCode}
                  helperText={errors.securityCode?.message}
                  autoFocus
                />
              </div>
            )}

            <div className="flex gap-10 justify-center pt-2">
              <button
                type="submit"
                className={`${globalButton} min-w-56`}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? <TailwindLoader size={6} /> : "Sign In"}
              </button>
            </div>
          </form>
          {/* Forgot Password Link */}
          <div className="text-center">
            <button
              onClick={() => setForgotModalOpen(true)}
              className="text-sm text-blue-600 hover:text-blue-500 hover:underline"
            >
              Forgot your password?
            </button>
          </div>
          {forgotModalOpen && (
            <Suspense fallback={<ModalFallback />}>
              <ForgotPasswordModal onClose={() => setForgotModalOpen(false)} />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
