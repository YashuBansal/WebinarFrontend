import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { signUp } from "../../../features/actions/auth";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import AppLoader from "../../../components/AppLoader";

const inputClass =
  "h-10 w-full rounded-lg border border-white/30 bg-white/20 px-3 text-sm text-white placeholder:text-white/50 shadow-sm backdrop-blur-sm transition-colors focus:border-wlh-brand focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-wlh-brand/50 disabled:cursor-not-allowed disabled:opacity-60 autofill:!bg-[rgba(15,23,42,0.85)] autofill:!text-white autofill:shadow-[inset_0_0_0_1000px_rgba(15,23,42,0.85)]";

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

function Signup() {
  const dispatch = useDispatch();
  const { isLoading, isUserLoggedIn } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeRefCode, setActiveRefCode] = useState("");

  useEffect(() => {
    const urlRef = searchParams.get("ref");
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

    if (urlRef) {
      localStorage.setItem("wlh_referrer", urlRef);
      localStorage.setItem("wlh_referrer_time", Date.now().toString());
      setActiveRefCode(urlRef);
    } else {
      const storedRef = localStorage.getItem("wlh_referrer");
      const storedTime = localStorage.getItem("wlh_referrer_time");

      if (storedRef && storedTime) {
        if (Date.now() - parseInt(storedTime, 10) < thirtyDaysInMs) {
          setActiveRefCode(storedRef);
        } else {
          localStorage.removeItem("wlh_referrer");
          localStorage.removeItem("wlh_referrer_time");
        }
      }
    }
  }, [searchParams]);

  const [isPasswordHidden, setPasswordHidden] = useState(false);
  const [isConfirmPasswordHidden, setConfirmPasswordHidden] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const togglePasswordVisibility = () => {
    setPasswordHidden(!isPasswordHidden);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordHidden(!isConfirmPasswordHidden);
  };

  const password = watch("password");

  const onSubmit = (data) => {
    const payload = {
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      ref: activeRefCode || "",
    };
    dispatch(signUp(payload)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        localStorage.removeItem("wlh_referrer");
        localStorage.removeItem("wlh_referrer_time");
        navigate("/login");
      }
    });
  };

  useEffect(() => {
    if (isUserLoggedIn) {
      navigate("/", { replace: true });
    }
  }, [isUserLoggedIn, navigate]);

  useEffect(() => {
    document.title = "Signup | Webinar Leads Hub";
  }, []);

  const formErrorMessage =
    errors.name?.message ||
    errors.email?.message ||
    errors.phone?.message ||
    errors.password?.message ||
    errors.confirmPassword?.message;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden font-sans transition-colors duration-500">
      {/* Immersive Dark Blue Gradient Background */}
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

      {/* Floating SaaS Elements */}
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

      {/* Glassmorphism Container */}
      <div
        className="animate-login-fade relative z-10 mx-4 w-full max-w-md"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(15px)",
          WebkitBackdropFilter: "blur(15px)",
          borderRadius: "16px",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.25)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          padding: "24px 32px",
        }}
      >
        <div className="mb-4 text-center">
          <div className="mb-2 flex justify-center">
            <img
              src="/wlh-logo.png"
              alt="Webinar Leads Hub"
              className="h-14 w-14 object-contain"
              fetchPriority="high"
            />
          </div>
          <h1
            className="mb-0.5 text-xl text-white font-semibold"
            style={{
              textShadow:
                "0 2px 10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(34, 181, 115, 0.5)",
            }}
          >
            WEBINAR LEADS <span className="text-wlh-brand">HUB</span>
          </h1>
          <p className="text-xs text-white/90">Create an account 🚀</p>
        </div>

        <form
          className="space-y-3"
          autoComplete="on"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div>
            <label htmlFor="name" className="mb-1 block text-[11px] font-medium text-white/90">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              className={inputClass}
              placeholder="Enter your full name"
              {...register("name", { required: "Full name is required" })}
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-[11px] font-medium text-white/90">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={inputClass}
              placeholder="Enter your email address"
              {...register("email", { required: "Email is required" })}
            />
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block text-[11px] font-medium text-white/90">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              className={inputClass}
              placeholder="e.g. +919876543210"
              {...register("phone", {
                required: "Phone number is required",
                pattern: {
                  value: /^\+91\d{10}$/,
                  message: "Phone number must start with +91 followed by 10 digits",
                },
              })}
            />
          </div>

          {/* Grid for Password & Confirm Password */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="password" className="mb-1 block text-[11px] font-medium text-white/90">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={isPasswordHidden ? "text" : "password"}
                  autoComplete="new-password"
                  className={`${inputClass} pr-10`}
                  placeholder="Password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Min 6 characters",
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-white/70 transition-all hover:bg-white/10 hover:text-white"
                  aria-label={
                    isPasswordHidden ? "Hide password" : "Show password"
                  }
                >
                  {isPasswordHidden ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-[11px] font-medium text-white/90"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={isConfirmPasswordHidden ? "text" : "password"}
                  autoComplete="new-password"
                  className={`${inputClass} pr-10`}
                  placeholder="Confirm password"
                  {...register("confirmPassword", {
                    required: "Confirm password",
                    validate: (value) =>
                      value === password || "Passwords do not match",
                  })}
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-white/70 transition-all hover:bg-white/10 hover:text-white"
                  aria-label={
                    isConfirmPasswordHidden ? "Hide password" : "Show password"
                  }
                >
                  {isConfirmPasswordHidden ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {formErrorMessage && (
            <div className="rounded-lg bg-red-500/20 px-3 py-1.5 text-[11px] text-red-300">
              {formErrorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex h-10 w-full items-center justify-center rounded-lg font-semibold text-white text-sm transition-all hover:scale-[1.01] hover:shadow-glow-button disabled:cursor-not-allowed disabled:opacity-70 mt-4"
            style={{ backgroundColor: "#22B573" }}
          >
            {isLoading ? <AppLoader size="sm" variant="inverse" /> : "Sign Up"}
          </button>

          <div className="pt-1 text-center">
            <p className="text-xs text-white/80">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-wlh-brand hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Signup;
