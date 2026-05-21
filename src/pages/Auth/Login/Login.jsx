import { lazy, Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { logIn } from "../../../features/actions/auth";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const ForgotPasswordModal = lazy(
  () => import("../ForgotPassword/ForgotPassword"),
);
import AppLoader from "../../../components/AppLoader";
import ModalFallback from "../../../components/Fallback/ModalFallback";

const inputClass =
  "h-12 w-full rounded-lg border border-white/30 bg-white/20 px-3 text-white placeholder:text-white/60 shadow-sm backdrop-blur-sm transition-colors focus:border-wlh-brand focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-wlh-brand/50 disabled:cursor-not-allowed disabled:opacity-60 autofill:!bg-[rgba(15,23,42,0.85)] autofill:!text-white autofill:shadow-[inset_0_0_0_1000px_rgba(15,23,42,0.85)]";

function EyeIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.35" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

function MoonIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function Login() {
  const dispatch = useDispatch();
  const { isLoggingIn, isUserLoggedIn } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [isPasswordHidden, setPasswordHidden] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [openCode, setOpenCode] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const togglePasswordVisibility = () => {
    setPasswordHidden(!isPasswordHidden);
  };

  const onSubmit = (data) => {
    dispatch(logIn(data)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        if (res.payload?.twoFa) {
          setOpenCode(true);
        } else {
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

  const formErrorMessage =
    errors.email?.message ||
    errors.password?.message ||
    errors.securityCode?.message;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden font-sans transition-colors duration-500">
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{
          background:
            "linear-gradient(135deg, #0a1628 0%, #1a2847 25%, #0f3460 50%, #1a2847 75%, #0a1628 100%)",
        }}
      >
        <div className="animate-pulse-slow absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-gradient-to-r from-green-500 to-teal-500 opacity-20 blur-3xl" />
        <div className="animate-pulse-slower absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-15 blur-3xl" />
        <div className="animate-pulse-slowest absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-cyan-500 to-green-400 opacity-10 blur-3xl" />
        <div className="absolute inset-0 opacity-5" aria-hidden />
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-float1 absolute left-4 top-16 md:left-12 md:top-24 lg:left-24">
          <div className="relative">
            <div className="absolute inset-0 h-20 w-20 scale-150 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 opacity-50 blur-2xl md:h-24 md:w-24" />
            <div className="absolute inset-0 h-20 w-20 rounded-full bg-blue-500 opacity-30 blur-xl animate-pulse md:h-24 md:w-24" />
            <div
              className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white p-3 md:h-24 md:w-24 md:p-4"
              style={{
                boxShadow:
                  "0 10px 40px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.9) inset",
              }}
            >
              <img
                src="/zapier_icon.png"
                alt=""
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>

        <div className="animate-float4 absolute right-4 top-16 md:right-12 md:top-24 lg:right-24">
          <div className="relative">
            <div className="absolute inset-0 h-20 w-20 scale-150 rounded-full bg-gradient-to-br from-green-400 to-green-600 opacity-50 blur-2xl md:h-24 md:w-24" />
            <div className="absolute inset-0 h-20 w-20 rounded-full bg-green-500 opacity-30 blur-xl animate-pulse md:h-24 md:w-24" />
            <div
              className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white p-3 md:h-24 md:w-24 md:p-4"
              style={{
                boxShadow:
                  "0 10px 40px rgba(34, 181, 115, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.9) inset",
              }}
            >
              <img
                src="/flexifunnel.png"
                alt=""
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>

        <div className="animate-float5 absolute left-4 top-1/2 hidden -translate-y-1/2 md:left-12 md:block lg:left-24">
          <div className="relative">
            <div className="absolute inset-0 h-24 w-24 scale-150 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 opacity-50 blur-2xl" />
            <div className="absolute inset-0 h-24 w-24 rounded-full bg-teal-500 opacity-30 blur-xl animate-pulse" />
            <div
              className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white p-4"
              style={{
                boxShadow:
                  "0 10px 40px rgba(20, 184, 166, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.9) inset",
              }}
            >
              <img
                src="/pabbly_logo.png"
                alt=""
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>

        <div className="animate-float6 absolute right-4 top-1/2 hidden -translate-y-1/2 md:right-12 md:block lg:right-24">
          <div className="relative">
            <div className="absolute inset-0 h-24 w-24 scale-150 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 opacity-50 blur-2xl" />
            <div className="absolute inset-0 h-24 w-24 rounded-full bg-blue-500 opacity-30 blur-xl animate-pulse" />
            <div
              className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white p-4"
              style={{
                boxShadow:
                  "0 10px 40px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.9) inset",
              }}
            >
              <img
                src="/Systeme.png"
                alt=""
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>

        <div className="animate-float2 absolute bottom-16 left-4 md:bottom-24 md:left-12 lg:left-24">
          <div className="relative">
            <div className="absolute inset-0 h-20 w-20 scale-150 rounded-full bg-gradient-to-br from-green-400 to-green-600 opacity-50 blur-2xl md:h-24 md:w-24" />
            <div className="absolute inset-0 h-20 w-20 rounded-full bg-green-500 opacity-30 blur-xl animate-pulse md:h-24 md:w-24" />
            <div
              className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white p-3 md:h-24 md:w-24 md:p-4"
              style={{
                boxShadow:
                  "0 10px 40px rgba(37, 211, 102, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.9) inset",
              }}
            >
              <img
                src="/whatsapp_logo.png"
                alt=""
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>

        <div className="animate-float3 absolute bottom-16 right-4 md:bottom-24 md:right-12 lg:right-24">
          <div className="relative">
            <div className="absolute inset-0 h-20 w-20 scale-150 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 opacity-50 blur-2xl md:h-24 md:w-24" />
            <div className="absolute inset-0 h-20 w-20 rounded-full bg-blue-500 opacity-30 blur-xl animate-pulse md:h-24 md:w-24" />
            <div
              className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white p-3 md:h-24 md:w-24 md:p-4"
              style={{
                boxShadow:
                  "0 10px 40px rgba(45, 140, 255, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.9) inset",
              }}
            >
              <img
                src="/zoom.png"
                alt=""
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="fixed right-4 top-4 z-50 rounded-full border border-white/20 bg-white/10 p-3 opacity-60 shadow-md backdrop-blur-md md:right-6 md:top-6"
        style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)" }}
        aria-disabled="true"
        title="Theme toggle is not available in this app"
        tabIndex={-1}
      >
        <MoonIcon className="text-white" />
      </button>

      <div
        className="animate-login-fade relative z-10 mx-4 w-full max-w-md"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(15px)",
          WebkitBackdropFilter: "blur(15px)",
          borderRadius: "16px",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.25)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          padding: "48px 40px",
        }}
      >
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <img
              src="/wlh-logo.png"
              alt="Webinar Leads Hub"
              className="h-24 w-24 object-contain"
              fetchPriority="high"
            />
          </div>
          <h1
            className="mb-2 text-3xl text-white"
            style={{
              textShadow:
                "0 2px 10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(34, 181, 115, 0.5)",
            }}
          >
            WEBINAR LEADS <span className="text-wlh-brand">HUB</span>
          </h1>
          <p className="text-lg text-white opacity-90">Welcome back 👋</p>
        </div>

        <form
          className="space-y-5"
          autoComplete="on"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div>
            <label htmlFor="email" className="mb-2 block text-sm text-white">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              disabled={openCode}
              autoFocus={!openCode}
              className={inputClass}
              placeholder="Enter your email"
              {...register("email", { required: "Email is required" })}
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm text-white">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={isPasswordHidden ? "text" : "password"}
                autoComplete="current-password"
                disabled={openCode}
                className={`${inputClass} pr-11`}
                placeholder="Enter your password"
                {...register("password", {
                  required: "Password is required",
                })}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                disabled={openCode}
                className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50"
                aria-label={
                  isPasswordHidden ? "Hide password" : "Show password"
                }
              >
                {isPasswordHidden ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {openCode && (
            <div className="pt-1">
              <label
                htmlFor="securityCode"
                className="mb-2 block text-sm text-white"
              >
                Security Code
              </label>
              <input
                id="securityCode"
                type="text"
                autoComplete="one-time-code"
                autoFocus
                className={inputClass}
                placeholder="Enter security code"
                {...register("securityCode", {
                  required: "Security code is required",
                })}
              />
            </div>
          )}

          {formErrorMessage && (
            <div className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-300">
              {formErrorMessage}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 shrink-0 rounded border-white/50 bg-white/10 text-wlh-brand focus:ring-wlh-brand focus:ring-offset-0"
              />
              <label
                htmlFor="remember"
                className="cursor-pointer text-sm text-white"
              >
                Remember me
              </label>
            </div>
            <button
              type="button"
              onClick={() => setForgotModalOpen(true)}
              className="text-sm text-white hover:underline"
            >
              Forgot your password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="flex h-12 w-full items-center justify-center rounded-lg font-medium text-white transition-all hover:scale-[1.02] hover:shadow-glow-button disabled:cursor-not-allowed disabled:opacity-70"
            style={{ backgroundColor: "#22B573" }}
          >
            {isLoggingIn ? <AppLoader size="md" variant="inverse" /> : "Sign In"}
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
