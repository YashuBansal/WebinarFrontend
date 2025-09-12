import React, { Suspense, useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar/Sidebar";
import Header from "./Header/Header";
import FallbackPage from "../Fallback/FallbackPage";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import AlarmBanner from "../AlarmBanner";
import alarm from "/alarm.wav";
import { insertUnAckAlarm, resetAlarmData } from "../../features/slices/alarm";
import { socket } from "../../socket";
const Layout = () => {
  const { isUserLoggedIn } = useSelector((state) => state.auth);
  const { isSidebarOpen } = useSelector((state) => state.globalData);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const audioRef = useRef(new Audio(alarm));
  const [bannerOpen, setBannerOpen] = useState(false);
  const [bannerData, setBannerData] = useState(null);
  const toggleRef = useRef();

  const closeBanner = () => {
    audioRef.current.pause();
    audioRef.current.loop = false;
    audioRef.current.currentTime = 0;
    setBannerOpen(false);
    setBannerData(null);
  };
  useEffect(() => {
    if (!isUserLoggedIn) {
      navigate("/login");
    }
  }, [isUserLoggedIn]);
  useEffect(() => {
    function onAlarmPlay(data) {
      const audio = audioRef.current;
      audio.loop = true; // Enable looping
      audio.play().catch((err) => console.error("Audio play error:", err)); // Handle potential play errors
      setBannerOpen(true);
      setBannerData(data.deleteResult || {});
      dispatch(insertUnAckAlarm(data.deleteResult));
      dispatch(resetAlarmData());
    }
    socket.on("playAlarm", onAlarmPlay);
    return () => {
      socket.off("playAlarm", onAlarmPlay);
    };
  }, [socket]);
  return (
    <div className="w-full max-w-screen ">
      <Header toggleButtonRef={toggleRef} />
    <Sidebar toggleButtonRef={toggleRef} />
      <Suspense fallback={<FallbackPage />}>
        <div
          className={` pt-7 transition-all ease-in-out duration-500 ${
            isSidebarOpen ? "sm:ml-64" : ""
          }`}
        >
          <Outlet />
        </div>
      </Suspense>
      <AlarmBanner
        isPopupVisible={bannerOpen}
        setPopupVisible={setBannerOpen}
        closeBanner={closeBanner}
        bannerData={bannerData}
      />
    </div>
  );
};

export default Layout;
