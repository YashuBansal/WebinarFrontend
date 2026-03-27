import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { instance } from "../services/axiosInterceptor";
import { logout } from "../features/slices/auth";
import { errorToast } from "../utils/extra";
import { roles as roleIds } from "../utils/roles";

async function fetchUserSubscription() {
  const response = await instance.get("/subscription");
  return response?.data ?? null;
}

export default function useUserSubscription() {
  const dispatch = useDispatch();
  const { isUserLoggedIn, userData } = useSelector((state) => state.auth);

  const role = userData?.role || "";
  const enabled =
    !!isUserLoggedIn && !!role && role !== roleIds.SUPER_ADMIN;

  const query = useQuery({
    queryKey: ["userSubscription"],
    queryFn: fetchUserSubscription,
    enabled,
    refetchInterval: enabled ? 60 * 1000 : false,
  });

  useEffect(() => {
    const subscription = query.data;
    const expiryRaw = subscription?.expiryDate;
    const isActive = userData?.isActive;
    console.log(`enabled: ${!enabled}, expiryRaw: ${!expiryRaw}, isActive: ${!isActive}`);

    if (!enabled) return;
    if (!expiryRaw || !isActive) return;

    const expiryDate = new Date(expiryRaw);
    const today = new Date();

    if (Number.isNaN(expiryDate.getTime())) return;

    if (expiryDate.getTime() < today.getTime()) {
      dispatch(logout());
      errorToast("Your subscription has expired.");
    }
  }, [dispatch, enabled, query.data, userData?.isActive]);

  return query;
}

