import { useDispatch, useSelector } from "react-redux";
import { deleteWebinar } from "../../features/actions/webinarContact";
import useAddUserActivity from "../../hooks/useAddUserActivity";
import ConfirmDeleteModal from "../ConfirmDeleteModal";

export default function Delete({ setModal, webinarName, id }) {
  const dispatch = useDispatch();
  const logUserActivity = useAddUserActivity();
  const { isLoading } = useSelector((state) => state.webinarContact);

  return (
    <ConfirmDeleteModal
      setModal={setModal}
      itemName={webinarName}
      isLoading={isLoading}
      triggerDelete={() => {
        dispatch(deleteWebinar(id));
        logUserActivity({
          action: "delete",
          type: "Webinar",
          detailItem: webinarName,
        });
      }}
    />
  );
}
