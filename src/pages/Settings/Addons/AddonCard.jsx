import { useDispatch, useSelector } from "react-redux";
import { checkoutAddon } from "../../../features/actions/razorpay";
import ComponentGuard from "../../../components/AccessControl/ComponentGuard";
import { errorToast, formatDateAsNumber } from "../../../utils/extra";
import { getGSTStateValue } from "../../../features/slices/auth";
import { useNavigate } from "react-router-dom";
import { instance } from "../../../services/axiosInterceptor";
import { Button } from "../../../components/ui/button";
import { buildAddonDescription, pickAddonIcon } from "./addonCardUtils";

const AddonCard = ({
  addon,
  id,
  roles,
  showAction = true,
  showExpiryDate = false,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.auth);
  const GST_VALUE = useSelector(getGSTStateValue);
  const Icon = pickAddonIcon(addon);
  const description = buildAddonDescription(addon);
  const priceDisplay =
    typeof addon?.addOnPrice === "number"
      ? addon.addOnPrice.toLocaleString("en-IN")
      : addon?.addOnPrice;

  const handleAddonSelection = (addonId) => {
    dispatch(checkoutAddon({ addon: addonId })).then((res) => {
      if (res?.payload?.order?.id && res?.payload?.purchase?._id) {
        const order = res?.payload?.order;
        const purchase = res?.payload?.purchase;
        const purchasedAddon = res?.payload?.addon;
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          order_id: order.id,
          name: "Add-on purchase",
          description: purchasedAddon?.addonName || "Add-on",
          handler: async (response) => {
            try {
              await instance.post(`/razorpay/addon/confirm`, {
                purchaseId: purchase._id,
                razorpay_order_id: response?.razorpay_order_id,
                razorpay_payment_id: response?.razorpay_payment_id,
                razorpay_signature: response?.razorpay_signature,
              });
            } catch (e) {
              errorToast(e);
            } finally {
              navigate(`/addons/${userData?._id}?purchaseId=${purchase._id}`, {
                replace: true,
              });
            }
          },
          theme: {
            color: "#3b82f6",
          },
        };

        const rzp = new Razorpay(options);
        rzp.open();
      }
    });
  };

  const unitLabel = `${GST_VALUE}% GST incl.`;

  const secondaryLine = showExpiryDate
    ? addon?.validityInDays != null
      ? `${addon.validityInDays}-day validity`
      : null
    : addon?.expiryDate
      ? `Expires ${formatDateAsNumber(addon.expiryDate)}`
      : null;

  return (
    <div
      className="group flex h-full gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800/90 dark:hover:border-slate-600 dark:hover:shadow-blue-950/20 sm:gap-5 sm:rounded-2xl sm:p-6"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 transition-transform duration-300 ease-out group-hover:scale-110 dark:bg-blue-500/15">
        <Icon className="h-7 w-7 text-blue-500 dark:text-blue-400" aria-hidden />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-1 flex flex-wrap items-start justify-between gap-2 gap-y-1">
          <h4
            className="truncate text-lg font-bold text-slate-900 dark:text-slate-50"
            title={addon.addonName}
          >
            {addon.addonName}
          </h4>
          <span className="shrink-0 font-black tracking-tight text-blue-500 dark:text-blue-400">
            ₹{priceDisplay}
          </span>
        </div>

        {secondaryLine ? (
          <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            {secondaryLine}
          </p>
        ) : null}

        <p className="mb-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {description}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {unitLabel}
          </span>

          <ComponentGuard allowedRoles={[roles.ADMIN]}>
            {showAction ? (
              <Button
                type="button"
                className="h-8 rounded-lg border-none bg-blue-500 px-4 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-600 hover:shadow-blue-500/30 dark:shadow-blue-900/40"
                onClick={() => handleAddonSelection(id)}
              >
                ADD TO PLAN
              </Button>
            ) : null}
          </ComponentGuard>
        </div>
      </div>
    </div>
  );
};

export default AddonCard;
