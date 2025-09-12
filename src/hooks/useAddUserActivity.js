import { useDispatch, useSelector } from "react-redux"; // Import useSelector
import { useEffect, useRef } from "react"; // Use useRef for the timer ID
import {
  addUserActivity,
  sendInactiveNotification,
} from "../features/actions/userActivity";
import useRoles from "./useRoles";
// store is no longer needed for getting state, useSelector is preferred in hooks

// Shared state across all instances of the hook - using useRef is a better practice
// within the hook for managing state that persists across renders but doesn't
// cause re-renders when changed.
// Let's keep the outside variable for minimal change based on original code,
// but be aware useRef is generally preferred inside hooks for this pattern.
const sharedState = {
  inactivityTimer: null, // Timer ID
};

let lastLog = null; // Variable to store the last log action
let lastLogTime = null; // Variable to store the last log time in milliseconds

const handleLastLog = (action, dispatch) => {
  // Only log "reActive" if the previous state was "inactive"
  if (lastLog === "inactive" && lastLogTime) {
    const currentTime = new Date().getTime();
    const timeDifference = currentTime - lastLogTime; // Calculate the time difference in milliseconds
    const timeDifferenceInSeconds = Math.floor(timeDifference / 1000); // Convert to seconds

    if (timeDifferenceInSeconds > 0) {
      // Only log if at least 1 second has passed
      const minutes = Math.floor(timeDifferenceInSeconds / 60);
      const seconds = timeDifferenceInSeconds % 60;
      let details = "User is active again";
      if (minutes > 0 || seconds > 0) {
        details += ` after ${
          minutes
            ? `${minutes} minute${minutes > 1 ? "s" : ""}${seconds ? "," : ""}`
            : ""
        }${
          seconds ? ` ${seconds} second${seconds > 1 ? "s" : ""}` : ""
        } of inactivity.`;
      } else {
        // Handle edge case where difference is less than a second but last was inactive
        details =
          "User is active again quickly after inactivity state was set.";
      }

      dispatch(
        addUserActivity({
          action: "reActive",
          details: details,
        })
      );
    }
  }
  // console.log("Updating last log. Action:", action, "Time:", new Date()); // Optional: Keep for debugging

  lastLog = action;
  lastLogTime = new Date().getTime(); // Update the last log time
};

const useAddUserActivity = () => {
  const roles = useRoles();
  const dispatch = useDispatch();

  // Use useSelector to subscribe to changes in auth state
  const userData = useSelector((state) => state.auth.userData);
  const subscription = useSelector((state) => state.auth.subscription);

  // Calculate inactivity time based on latest userData
  const InactivityTimeInSeconds = userData?.inactivityTime || 10;
  const INACTIVITY_LIMIT = InactivityTimeInSeconds * 1000;

  // Memoize or derive values that are dependencies for effects/callbacks
  const employeeInactivityAllowed = subscription?.plan?.employeeInactivity;
  const isEmployee = roles.isEmployeeId(""); // Assuming isEmployeeId('') checks if *this* user is an employee

  // Function to set the inactivity timer
  const setInactivityTimer = () => {
    // Clear any existing timer before setting a new one
    if (sharedState.inactivityTimer) {
      clearTimeout(sharedState.inactivityTimer);
      sharedState.inactivityTimer = null;
      // console.log("Cleared existing inactivity timer."); // Optional: For debugging
    }

    // Only set a new timer if the feature is allowed and the user is an employee
    if (employeeInactivityAllowed && isEmployee) {
      // console.log(`Setting inactivity timer for ${InactivityTimeInSeconds} seconds.`); // Optional: For debugging
      sharedState.inactivityTimer = setTimeout(() => {
        console.log(
          `User is inactive for ${InactivityTimeInSeconds} seconds. Sending notification.`
        );

        // Log the inactive action immediately when the timer fires
        lastLog = "inactive"; // Update last log state
        lastLogTime = new Date().getTime(); // Update last log time
        dispatch(
          addUserActivity({
            action: "inactive",
            details: `User is inactive for ${InactivityTimeInSeconds} seconds.`,
          })
        );

        // Send notification after logging activity
        dispatch(
          sendInactiveNotification({
            userName: userData?.userName,
            email: userData?.email,
            role: userData?.role,
            userId: userData?._id,
            seconds: InactivityTimeInSeconds,
          })
        );
      }, INACTIVITY_LIMIT);
    } else {
      // console.log("Inactivity timer not set: conditions not met.", { employeeInactivityAllowed, isEmployee }); // Optional: For debugging
    }
  };

  // Function to reset the inactivity timer (clears and sets a new one if conditions allow)
  const resetInactivityTimer = () => {
    setInactivityTimer(); // Simply call set, which handles clearing the old one
  };

  // Effect 1: Handles initial timer setup and resets when relevant state changes
  // This effect reacts to changes in subscription, user data, roles, and the time limit itself.
  useEffect(() => {
    // console.log(
    //   "useEffect: Subscription, userData, roles, or time limit changed. Attempting to set/reset timer."
    // );
    setInactivityTimer(); // Attempt to set or reset the timer based on current state

    // Cleanup function: Clear the timer when the hook unmounts or dependencies change
    return () => {
      // console.log("useEffect cleanup: Clearing inactivity timer.");
      if (sharedState.inactivityTimer) {
        clearTimeout(sharedState.inactivityTimer);
        sharedState.inactivityTimer = null;
      }
    };
    // Dependencies: Include all values from state or props that affect the timer logic
  }, [subscription, userData, roles, dispatch, INACTIVITY_LIMIT]); // Add INACTIVITY_LIMIT as it's derived from userData

  // logUserActivity remains mostly the same, but it now calls resetInactivityTimer
  // which in turn calls setInactivityTimer based on the *latest* state from useSelector
  const logUserActivity = ({
    action,
    details,
    navigateType,
    type = "",
    detailItem,
    activityItem,
  }) => {
    let detailLog = "";

    if( !userData || !subscription){
      console.warn("User data or subscription not available. Skipping activity log.");
      return;
    }

    // Handle explicitly provided action and details first
    if (action && details) {
      handleLastLog(action, dispatch); // Log the transition
      dispatch(addUserActivity({ action, details, item: activityItem }));
      resetInactivityTimer(); // Reset timer on ANY activity
      return;
    }

    // Handle action types from the switch statement
    switch (action) {
      case "navigate":
        detailLog = `User navigated to the ${navigateType}: ${detailItem}`;
        break;
      case "edit":
        detailLog = `User edited the ${type}: ${detailItem}`;
        break;
      case "update":
        detailLog = `User updated the ${type}: ${detailItem}`;
        break;
      case "create":
        detailLog = `User created the ${type}: ${detailItem}`;
        break;
      case "delete":
        detailLog = `User deleted the ${type}: ${detailItem}`;
        break;
      case "import":
        detailLog = `User imported the ${type}: ${detailItem}`;
        break;
      case "switch":
        detailLog = `User switched to the ${type}: ${detailItem}`;
        break;
      case "filter":
        detailLog = `User applied filter ${type}: ${detailItem}`;
        break;
      case "note":
        detailLog = `User added a note to the ${type}: ${detailItem}`;
        break;
      case "setAlarm":
        detailLog = `User set an alarm for the ${type}: ${detailItem}`;
        break;
      default:
        // Handle unknown actions if necessary, or just skip logging
        console.warn(`Unknown activity action type: ${action}`);
        return; // Don't log unknown actions
    }

    handleLastLog(action, dispatch); // Log the transition *before* dispatching the new activity
    dispatch(
      addUserActivity({ action, details: detailLog, item: activityItem })
    );
    resetInactivityTimer(); // Reset timer on ANY activity logged via this function
  };

  return logUserActivity;
};

export default useAddUserActivity;
