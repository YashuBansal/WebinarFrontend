import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { enrollmentsColumn } from "../../utils/columnData";
import DataTable from "../../components/Table/DataTable";
import { getWebinarEnrollments } from "../../features/actions/attendees";
import { VisibilityIcon } from "../../components/SVGs";

const ExportModal = lazy(() => import("../../components/Export/ExportModal"));

import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import { exportWebinarEnrollments } from "../../features/actions/export-excel";
import ModalFallback from "../../components/Fallback/ModalFallback";

const Enrollments = (props) => {
  const tableHeader = "Enrollments";
  const exportModalName = "EnrollmentsModalName";

  const { id } = useParams();
  const { tabValue, page, setPage, webinarData } = props;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { webinarEnrollments, totalPages, isLoading, enrollmentCounts } =
    useSelector((state) => state.attendee);
  const [selected, setSelected] = useState("All");

  const modalState = useSelector((state) => state.modals.modals);
  const exportModalOpen = modalState[exportModalName] ? true : false;

  const LIMIT = useSelector((state) => state.pageLimits[tableHeader] || 10);

  const productOptions = useMemo(() => {
    if (Array.isArray(webinarData?.productIds)) {
      const products = webinarData?.productIds;

      return products.map((product) => ({
        label: product.name,
        value: product._id,
      }));
    }
    return [];
  }, [webinarData]);

  const fetchData = useCallback(() => {
    dispatch(
      getWebinarEnrollments({
        id: id,
        page: page,
        limit: LIMIT,
        product: selected,
      })
    );
  }, [dispatch, id, page, LIMIT, selected]);

  const handleDownload = useCallback(
    ({ limit, columns }) => {
      dispatch(
        exportWebinarEnrollments({
          limit,
          columns,
          product: selected,
          webinarId: webinarData._id,
          webinarname: webinarData.webinarName,
        })
      );
    },
    [selected, webinarData]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const actionIcons = [
    {
      icon: () => (
        <img
          src={VisibilityIcon}
          alt="Bookmark"
          className="min-h-6 h-6 w-6 min-w-6"
        />
      ),
      tooltip: "View Attendee Info",
      onClick: (item) => {
        navigate(
          `/particularContact?email=${item?.attendee}&attendeeId=${item?.attendeeId}`
        );
      },
      readOnly: true,
    },
  ];

  const AttendeeDropdown = () => {
    const handleChange = (event) => {
      const label = event.target.value;
      setSelected(label);
      setPage(1);
    };

    return (
      <div className="md:flex gap-4 grid">
        <FormControl className="md:w-80 " variant="outlined">
          <InputLabel id="attendee-label">Activity</InputLabel>
          <Select
            labelId="attendee-label"
            className="h-10"
            value={selected}
            onChange={handleChange}
            label="Activity"
          >
            <MenuItem value="All">All</MenuItem>
            {productOptions.map((product, index) => (
              <MenuItem key={index} value={product.value}>{product.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
    );
  };

  return (
    <>
      <DataTable
        tableHeader={tableHeader}
        exportModalName={exportModalName}
        tableUniqueKey="enrollmentsTable"
        ButtonGroup={AttendeeDropdown}
        tableData={{
          columns: enrollmentsColumn.map((column) => {
            return column;
          }),
          rows: webinarEnrollments,
        }}
        actions={actionIcons}
        totalPages={totalPages}
        page={page}
        setPage={setPage}
        limit={LIMIT}
        isLoading={isLoading}
      />

      {exportModalOpen && (
        <Suspense fallback={<ModalFallback />}>
          <ExportModal
            modalName={exportModalName}
            columns={enrollmentsColumn}
            tableName={tableHeader}
            handleExport={handleDownload}
          />
        </Suspense>
      )}
    </>
  );
};

export default Enrollments;
