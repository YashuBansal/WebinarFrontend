import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { Paper, Button, Tabs, Tab } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import ComponentGuard from "../../components/AccessControl/ComponentGuard";
import useRoles from "../../hooks/useRoles";
import { getNoticeBoard } from "../../features/actions/noticeBoard";
import { resetSuccessAndUpdate } from "../../features/slices/noticeBoard";
import { globalButton } from "../../utils/style";
import "./tiptap.css"; // TipTap custom styles

const NoticeBoardPage = () => {
  const roles = useRoles();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.auth);
  const { noticeData } = useSelector((state) => state.noticeBoard);
  const { employeeModeData } = useSelector((state) => state.employee);
  const [tabValue, setTabValue] = useState("sales");

  const editorContent =
    noticeData?.content || "<p>No notices available yet.</p>";
  const fetchData = useCallback(() => {
    if (roles.getRoleNameById(userData?.role) === "ADMIN") {
      dispatch(getNoticeBoard(tabValue));
    } else if (roles.getRoleNameById(userData?.role) === "EMPLOYEE SALES") {
      dispatch(getNoticeBoard("sales"));
    } else if (roles.getRoleNameById(userData?.role) === "EMPLOYEE REMINDER") {
      dispatch(getNoticeBoard("reminder"));
    }
  }, [dispatch, tabValue, userData]);

  useEffect(() => {
    fetchData();
  }, [fetchData, dispatch]);

  useLayoutEffect(() => {
    dispatch(resetSuccessAndUpdate());
  }, [dispatch]);

  const handleTabChange = (_, newValue) => {
    setTabValue(newValue);
  };

  return (
    <div className="pt-14  md:px-8 px-4 lg:px-12  flex flex-col items-center">
      <ComponentGuard allowedRoles={[roles.ADMIN]}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          centered
          className="border-b border-gray-200"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Reminder" value="reminder" className="text-gray-600" />
          <Tab label="Sales" value="sales" className="text-gray-600" />
        </Tabs>
      </ComponentGuard>
      {/* Update Button at the top right */}
      <div className="flex w-full max-w-4xl justify-between items-center">
        <div className="text-4xl font-bold">Notice Board</div>
        <ComponentGuard
          allowedRoles={[roles.ADMIN]}
          conditions={[userData?.isActive, employeeModeData ? false : true]}
        >
          {" "}
          <button
            className={globalButton}
            onClick={() => navigate("/notice-board/update?type=" + tabValue)}
          >
            Update
          </button>
        </ComponentGuard>
      </div>

      {/* Preview content area */}
      <div className="max-w-4xl w-full  mt-10">
        <Paper className="p-6 bg-white shadow-lg rounded-lg border border-gray-200">
          <div
            className="preview-content text-base leading-relaxed text-gray-700"
            dangerouslySetInnerHTML={{ __html: editorContent }}
          />
        </Paper>
      </div>
    </div>
  );
};

export default NoticeBoardPage;
