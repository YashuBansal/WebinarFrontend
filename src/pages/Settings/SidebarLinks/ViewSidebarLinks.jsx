import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { IconButton, Skeleton, Stack, Tooltip } from "@mui/material";
import { deleteSidebarLink, getAllSidebarLinksForSuperAdmin } from "../../../features/actions/sidebarLink";
import useMediaQuery from "../../../hooks/useMediaQuery"; // Assuming you have this hook

// Import your components and assets
import DeleteIcon from "@mui/icons-material/Delete";
import Delete from "../../../components/ConfirmDeleteModal";
import { VisibilityIcon } from "../../../components/SVGs";
import { globalButton } from "../../../utils/style";

// --- New Reusable Components for Responsive View ---

// A skeleton loader that mimics the card's layout for a better UX.
const CardSkeleton = () => (
  <div className="rounded-lg border bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <Skeleton variant="text" width="60%" height={30} />
      <Skeleton variant="circular" width={32} height={32} />
    </div>
    <Skeleton variant="text" width="80%" height={20} className="mt-2" />
  </div>
);

// The responsive card component for displaying a single sidebar link.
const SidebarLinkCard = ({ item, onView, onDelete }) => (
  <div className="rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
    <div className="flex items-start justify-between gap-2">
      <div>
        <h3 className="font-semibold text-gray-900">{item?.title}</h3>
        <span className="mt-1 inline-block rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
          Role: {item?.role?.name ? item?.role?.name.split("_").join(" ") : "All"}
        </span>
      </div>
      <div className="flex flex-shrink-0 items-center">
        <Tooltip title="View Details" arrow>
          <IconButton size="small" onClick={() => onView(item)}>
            <img src={VisibilityIcon} alt="View" className="h-5 w-5" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete Link" arrow>
          <IconButton size="small" color="error" onClick={() => onDelete(item._id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
    </div>
    <p className="mt-3 break-all border-t pt-3 text-sm text-gray-600">
      {item?.link}
    </p>
  </div>
);


const ViewSidebarLinks = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  const { allSidebarLinks, isLoading } = useSelector((state) => state.sidebarLink);

  const [selectedLink, setSelectedLink] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [linkIdToDelete, setLinkIdToDelete] = useState(null);

  useEffect(() => {
    dispatch(getAllSidebarLinksForSuperAdmin());
  }, [dispatch]);

  const handleOpenModal = (link) => {
    setSelectedLink(link);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedLink(null);
    setIsModalOpen(false);
  };

  const openDeleteConfirmation = (id) => {
    setLinkIdToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (linkIdToDelete) {
      dispatch(deleteSidebarLink(linkIdToDelete)).then((res) => {
        if (res?.meta.requestStatus === "fulfilled") {
          dispatch(getAllSidebarLinksForSuperAdmin());
          setDeleteModalOpen(false);
          setLinkIdToDelete(null);
        }
      });
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return isSmallScreen ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <tbody>
          <tr>
            <td colSpan="4" className="px-6 py-8">
              <Stack spacing={4}>
                <Skeleton variant="rounded" height={30} />
                <Skeleton variant="rounded" height={25} />
                <Skeleton variant="rounded" height={20} />
              </Stack>
            </td>
          </tr>
        </tbody>
      );
    }

    if (!allSidebarLinks || allSidebarLinks.length === 0) {
      return (
        <div className="col-span-full py-12 text-center text-gray-500">
          No sidebar links found.
        </div>
      );
    }

    if (isSmallScreen) {
      return (
        <div className="space-y-4">
          {allSidebarLinks.map((item) => (
            <SidebarLinkCard
              key={item._id}
              item={item}
              onView={handleOpenModal}
              onDelete={openDeleteConfirmation}
            />
          ))}
        </div>
      );
    }

    return (
      <tbody className="divide-y divide-gray-200">
        {allSidebarLinks.map((item) => (
          <tr key={item._id} className="bg-white hover:bg-gray-50">
            <td className="px-6 py-4 font-medium text-gray-900">{item?.title}</td>
            <td className="px-6 py-4">{item?.role?.name ? item?.role?.name.split("_").join(" ") : "All"}</td>
            <td className="px-6 py-4 max-w-xs truncate" title={item?.link}>{item?.link}</td>
            <td className="px-6 py-4">
              <div className="flex items-center">
                <Tooltip title="View Details" arrow>
                  <IconButton onClick={() => handleOpenModal(item)}>
                    <img src={VisibilityIcon} alt="View" className="h-6 w-6" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Link" arrow>
                  <IconButton color="error" onClick={() => openDeleteConfirmation(item._id)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    );
  };

  return (
    <>
      <div className="p-4 sm:p-6 md:p-10 mt-4">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Sidebar Links</h1>
          <button
            onClick={() => navigate("/sidebarLinks/addSidebarLink")}
            className={globalButton}
          >
            Add Sidebar Link
          </button>
        </div>

        {isSmallScreen ? (
          renderContent()
        ) : (
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Title</th>
                  <th scope="col" className="px-6 py-3">Role</th>
                  <th scope="col" className="px-6 py-3">Link</th>
                  <th scope="col" className="px-6 py-3">Action</th>
                </tr>
              </thead>
              {renderContent()}
            </table>
          </div>
        )}
      </div>

      {isModalOpen && selectedLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">Sidebar Link Details</h2>
            <div className="space-y-2">
              <p><span className="font-semibold">Title:</span> {selectedLink.title}</p>
              <p className="break-all"><span className="font-semibold">Link:</span> {selectedLink.link}</p>
              <p><span className="font-semibold">Role:</span> {selectedLink.role?.name || "All Users"}</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCloseModal}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <Delete
          setModal={setDeleteModalOpen}
          triggerDelete={handleDelete}
          isLoading={isLoading}
        />
      )}
    </>
  );
};

export default ViewSidebarLinks;