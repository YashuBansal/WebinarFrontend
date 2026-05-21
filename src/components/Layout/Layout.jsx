import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar/Sidebar";
import Header from "./Header/Header";
import FallbackPage from "../Fallback/FallbackPage";
import { useDispatch, useSelector } from "react-redux";
import AlarmBanner from "../AlarmBanner";

import { insertUnAckAlarm, resetAlarmData } from "../../features/slices/alarm";
import { socket } from "../../socket";
import { toggleSidebar } from "../../features/slices/globalData";
import useMediaQuery from "../../hooks/useMediaQuery";

const Layout = () => {
  const { isUserLoggedIn } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const audioRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));
  const [bannerOpen, setBannerOpen] = useState(false);
  const [bannerData, setBannerData] = useState(null);
  const toggleRef = useRef();

  const isMdUp = useMediaQuery("(min-width: 768px)");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isPinned, setIsPinned] = useState(false);

  const mainMarginLeft = isMdUp
    ? sidebarCollapsed && !isPinned
      ? 80
      : 280
    : 0;

  const isChatPage = location.pathname.split('/').includes('chat');

  const handleMenuButtonClick = useCallback(() => {
    if (isMdUp) {
      setSidebarCollapsed((prev) => {
        const next = !prev;
        if (next) setIsPinned(false);
        return next;
      });
    } else {
      dispatch(toggleSidebar());
    }
  }, [isMdUp, dispatch]);

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
  }, [isUserLoggedIn, navigate]);
  useEffect(() => {
    function onAlarmPlay(data) {
      const audio = audioRef.current;
      audio.loop = true;
      audio.play().catch((err) => console.error("Audio play error:", err));
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
    <div
      className="flex min-h-screen w-full max-w-full flex-col overflow-hidden font-sans transition-colors duration-300 bg-[#F2F4F6] dark:bg-slate-950"
    >
      <Header
        toggleButtonRef={toggleRef}
        onMenuButtonClick={handleMenuButtonClick}
      />
      <Sidebar
        toggleButtonRef={toggleRef}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        isPinned={isPinned}
        setIsPinned={setIsPinned}
      />

      {/* Fixed sidebar + flow column: NEVER use w-full here with marginLeft — it overflows viewport (right cut off, fake “double” left gap). */}
      <div
        className="box-border flex min-h-0 min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out"
        style={{
          marginLeft: mainMarginLeft,
          width: `calc(100% - ${mainMarginLeft}px)`,
        }}
      >
        <main
          className="flex-1 relative min-h-0 w-full overflow-hidden"
          style={{
            marginTop: "64px",
            height: "calc(100vh - 64px)",
          }}
        >
          <div className={`custom-scrollbar absolute inset-0 min-w-0 max-w-full overflow-x-hidden ${isChatPage ? 'overflow-y-hidden' : 'overflow-y-auto'}`}>
            <Suspense fallback={<FallbackPage />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>

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
