import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  generateTokenFor2FA,
  getCurrentUserForUpdate,
  VerifyAndToggle2FA,
} from "../../features/actions/auth";
import {
  clearOTPGenerated,
  clearSecretToken,
} from "../../features/slices/auth";

// Material-UI Imports
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import AppLoader from "../../components/AppLoader";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import IconButton from "@mui/material/IconButton";

const TwoFactorAuthSection = () => {
  const dispatch = useDispatch();
  const { userData, isLoading, isSuccess } = useSelector((state) => state.auth);
  const secretToken = userData?.twoFactorAuthenticationSecret;

  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");

  // Refetch user data on successful 2FA status change
  useEffect(() => {
    if (isSuccess) {
      dispatch(getCurrentUserForUpdate());
      dispatch(clearOTPGenerated());
    }
  }, [isSuccess, dispatch]);

  // Clean up the temporary secret token when the component unmounts
  useEffect(() => {
    dispatch(getCurrentUserForUpdate());
    return () => {
      dispatch(clearSecretToken());
    };
  }, [dispatch]);

  // Clear form state if the 2FA status changes
  useEffect(() => {
    setVerificationCode("");
    setError("");
  }, [userData?.isTwoFactorAuthenticationEnabled]);

  const handleGenerate = () => {
    setError("");
    setVerificationCode(""); // Clear previous code input
    dispatch(generateTokenFor2FA());
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(secretToken);
    // You could add a small snackbar/toast here for user feedback
  };

  // Unified handler for both enabling and disabling 2FA
  const handleSubmitCode = () => {
    if (!/^\d{6}$/.test(verificationCode)) {
      setError("Please enter a valid 6-digit code.");
      return;
    }
    setError("");
    dispatch(VerifyAndToggle2FA({ code: verificationCode }))
      .unwrap() // Use unwrap to handle promise settlement
      .catch((err) => {
        setError(err.message || "Invalid verification code. Please try again.");
      });
  };

  return (
    <div className="bg-white shadow-md w-full rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">
        Two-Factor Authentication (2FA)
      </h2>

      {!userData?.isTwoFactorAuthenticationEnabled ? (
        // UI for ENABLING 2FA
        <div>
          <p className="text-gray-600 mb-4">
            Protect your account by requiring a second verification method on
            login.
          </p>
          {!secretToken ? (
            <Button
              variant="contained"
              onClick={handleGenerate}
              disabled={isLoading}
            >
              {isLoading ? <AppLoader size="md" variant="inverse" /> : "Enable 2FA"}
            </Button>
          ) : (
            // After clicking "Enable", show setup instructions
            <Box className="mt-4 p-4 border border-gray-200 rounded-md">
              <Typography variant="h6" gutterBottom>
                Complete Setup
              </Typography>
              <Typography variant="body1" className="mb-2">
                1. Open your authenticator app (e.g., Google Authenticator,
                Authy).
              </Typography>
              <Typography variant="body1" className="mb-2">
                2. Add a new account and choose to "Enter a setup key".
              </Typography>
              <Typography variant="body1" className="mb-3">
                3. Enter the following key:
              </Typography>

              <Box className="flex items-center bg-gray-100 p-2 rounded-md mb-4">
                <code className="text-lg font-mono flex-grow">
                  {secretToken
                    ? `${secretToken.slice(0, 4)}••••••${secretToken.slice(-4)}`
                    : ""}
                </code>

                <IconButton onClick={copyToClipboard} title="Copy to clipboard">
                  <ContentCopyIcon />
                </IconButton>
              </Box>

              <Typography variant="body1" className="mb-2">
                4. Enter the 6-digit code from your app to finalize:
              </Typography>
              <TextField
                label="Verification Code"
                variant="outlined"
                fullWidth
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                inputProps={{ maxLength: 6 }}
                error={!!error}
                helperText={error}
                className="mb-4"
              />
              <div className="p-2"></div>
              <Button
                variant="contained"
                onClick={handleSubmitCode}
                disabled={isLoading}
              >
                {isLoading ? (
                  <AppLoader size="md" variant="inverse" />
                ) : (
                  "Verify & Activate"
                )}
              </Button>
            </Box>
          )}
        </div>
      ) : (
        // UI for DISABLING 2FA
        <Box>
          <p className="text-green-700 font-semibold mb-4">
            Two-Factor Authentication is currently ENABLED.
          </p>
          <Typography variant="body1" className="mb-2 text-gray-600">
            To disable this feature, please enter the current 6-digit code from
            your authenticator app.
          </Typography>
          <TextField
            label="Verification Code"
            variant="outlined"
            fullWidth
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            inputProps={{ maxLength: 6 }}
            error={!!error}
            helperText={error}
            sx={{ my: 2, maxWidth: "350px" }}
          />
          <div className="p-1"></div>
          <Button
            variant="outlined"
            color="error"
            onClick={handleSubmitCode}
            disabled={isLoading || !verificationCode}
          >
            {isLoading ? <AppLoader size="md" variant="error" /> : "Verify & Disable"}
          </Button>
        </Box>
      )}
    </div>
  );
};

export default TwoFactorAuthSection;
