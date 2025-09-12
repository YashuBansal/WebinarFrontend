import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { jsPDF } from "jspdf";
import { getAdminBillingHistory } from "../../../features/actions/pricePlan";
import Pagination from "@mui/material/Pagination";
import PageLimitEditor from "../../../components/PageLimitEditor";
import { getSuperAdmin } from "../../../features/actions/auth";
import { toast } from "sonner";
import { formatDateAsNumber } from "../../../utils/extra";
import { useNavigate } from "react-router-dom";

import DownloadIcon from "../../../components/SVGs/download-blueish.svg";
import { getGSTStateValue } from "../../../features/slices/auth";
import useMediaQuery from "../../../hooks/useMediaQuery";

const BillingHistory = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const GST_VALUE = useSelector(getGSTStateValue);
  const { billingHistory, totalPages } = useSelector(
    (state) => state.pricePlans
  );
  const { superAdminData, userData } = useSelector((state) => state.auth);

  const [page, setPage] = useState(1);
  const LIMIT = useSelector(
    (state) => state.pageLimits["billingHistory"] || 10
  );

  useEffect(() => {
    dispatch(getAdminBillingHistory({ page, limit: LIMIT }));
  }, [page, LIMIT]);

  useEffect(() => {
    console.log("userData", userData);
    dispatch(getSuperAdmin());
  }, []);

  const downloadPDF = (bill) => {
    if (!superAdminData || !userData) {
      toast.error("Super Admin and Admin Data is required to download the PDF");
      return;
    }

    if (!superAdminData?.address) {
      toast.error("Super Admin's Address is required to download the PDF");
      return;
    }

    if (!userData?.address) {
      toast.error("Address is required to download the PDF");
      navigate("/profile");
      return;
    }

    if (!bill?.date) {
      toast.error("Invalid Date");
      return;
    }

    const doc = new jsPDF();

    let YAxis = 20;
    doc.setFontSize(40);
    doc.setFont("Times New Roman", "bold");
    doc.text("Invoice", 200, YAxis + 5, { align: "right" });

    doc.setFontSize(9);
    doc
      .text("" + bill?.invoiceNumber || "" + "", 200, YAxis + 15, {
        align: "right",
      })
      .setFontSize(10);

    doc.text(
      "Invoice No. :",
      200 - doc.getTextWidth(bill?.invoiceNumber || ""),
      YAxis + 15,
      {
        align: "right",
      }
    );

    doc.setFontSize(12);
    doc.text(superAdminData?.companyName, 13, YAxis).setFontSize(9);

    YAxis += 5;
    doc.setFont("Times New Roman", "normal");
    doc.text("Email : ", 13, YAxis);
    doc.text("" + superAdminData?.email + "", 30, YAxis);

    YAxis = YAxis + 5;

    doc.text("Address : ", 13, YAxis);
    doc.text(superAdminData.address, 30, YAxis);

    YAxis += 10;
    doc
      .setFont("Times New Roman", "bold")
      .text("Bill To", 13, YAxis)
      .setFont("Times New Roman", "normal");

    YAxis += 5;

    doc
      .text("Company Name : ", 13, YAxis)
      .text("" + userData?.companyName + "", 40, YAxis);

    YAxis += 5;

    doc.text("Email : ", 13, YAxis).text("" + userData?.email + "", 40, YAxis);

    YAxis += 5;

    doc
      .text("Contact : ", 13, YAxis)
      .text("" + userData?.phone + "", 40, YAxis);

    YAxis += 5;

    doc.text("Address : ", 13, YAxis).text(userData.address, 40, YAxis);

    if (userData?.gst) {
      YAxis += 5;

      doc.text("GSTIN : ", 13, YAxis).text("" + userData.gst + "", 40, YAxis);
    }
    YAxis += 3;

    doc.line(13, YAxis, 200, YAxis);

    YAxis += 10;

    if (bill.addOn) {
      doc
        .setFont("Times New Roman", "bold")
        .text("Item Type : ", 13, YAxis)
        .text("Add-On Name :", 13, YAxis + 5)
        .setFont("Times New Roman", "normal")
        .text("Add-On", 40, YAxis)
        .text("" + bill?.addOn?.addonName + "", 40, YAxis + 5);
    } else {
      doc
        .setFont("Times New Roman", "bold")
        .text("Item Type : ", 13, YAxis)
        .text("Plan Name :", 13, YAxis + 5)
        .setFont("Times New Roman", "normal")
        .text("Plan", 40, YAxis)
        .text("" + bill?.plan?.name + "", 40, YAxis + 5);
    }
    YAxis += 10;

    const date = new Date(bill?.date);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    const formattedDate = `${day}-${month}-${year} ${hours}:${minutes}`;

    doc
      .setFont("Times New Roman", "bold")
      .text("Purchase Date : ", 13, YAxis)
      .setFont("Times New Roman", "normal")
      .text(formattedDate, 40, YAxis);

    YAxis += 3;

    doc.line(13, YAxis, 200, YAxis);

    YAxis += 6;

    doc
      .text("DESCRIPTION", 13, YAxis)
      .text("UNITS", 130, YAxis, { align: "right" })
      .text("UNIT PRICE", 170, YAxis, { align: "right" })
      .text("AMOUNT (INR)", 200, YAxis, { align: "right" });
    YAxis += 3;

    doc.line(13, YAxis, 200, YAxis);

    YAxis += 8;

    const description = bill.addOn
      ? `${bill.addOn.addonName} (Add-On)`
      : `${bill.plan.name} (Plan)`;

    doc.setFontSize(12);

    doc
      .setFont("Times New Roman", "normal")
      .text(description, 13, YAxis)
      .text("1", 130, YAxis, { align: "right" })
      .text(`Rs.${bill.itemAmount}`, 170, YAxis, { align: "right" })
      .setFont("Times New Roman", "bold")
      .text(`Rs.${bill.itemAmount}`, 200, YAxis, { align: "right" });

    YAxis += 5;

    doc.line(13, YAxis, 200, YAxis);

    YAxis += 5;

    doc
      .setFont("Times New Roman", "normal")
      .text(`Discount`, 170, YAxis, { align: "right" })
      .text(`Rs.${bill.discountAmount}`, 200, YAxis, { align: "right" });

    YAxis += 4;

    doc.line(150, YAxis, 200, YAxis);

    YAxis += 7;

    doc
      .setFont("Times New Roman", "normal")
      .text(`Sub Total`, 170, YAxis, { align: "right" })
      .text(`Rs.${bill.itemAmount - bill.discountAmount}`, 200, YAxis, {
        align: "right",
      });

    YAxis += 7;

    doc
      .text(`IGST @ ${GST_VALUE}%`, 170, YAxis, { align: "right" })
      .text(`Rs.${bill.taxAmount}`, 200, YAxis, { align: "right" });
    YAxis += 4;

    doc.line(150, YAxis, 200, YAxis);

    YAxis += 7;

    doc
      .setFont("Times New Roman", "bold")
      .text(`Total`, 170, YAxis, { align: "right" })
      .text(`Rs.${bill.amount}`, 200, YAxis, { align: "right" });

    YAxis += 4;
    doc.line(150, YAxis, 200, YAxis);

    doc.save("a4.pdf");
  };

  const isSmallScreen = useMediaQuery("(max-width: 1280px)");
  const hasHistory = billingHistory && billingHistory.length > 0;

  return (
    <div className="w-full pt-14 p-4 sm:p-6">
      <div className="rounded-lg bg-gray-50 p-4 sm:p-6">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-700">Billing History</h2>
        </div>

        {!hasHistory ? (
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-gray-500">No billing history found.</p>
          </div>
        ) : isSmallScreen ? (
          // --- CARD VIEW for Small Screens ---
          <div className="space-y-4">
            {billingHistory.map((bill) => (
              <BillingCard
                key={bill._id}
                bill={bill}
                onDownload={downloadPDF}
              />
            ))}
          </div>
        ) : (
          // --- TABLE VIEW for Larger Screens ---
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full whitespace-nowrap text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="py-3 px-4 border-b">Invoice #</th>
                  <th className="py-3 px-4 border-b">Creation Date</th>
                  <th className="py-3 px-4 border-b">Start Date</th>
                  <th className="py-3 px-4 border-b">Expiry Date</th>
                  <th className="py-3 px-4 border-b">Billing Type</th>
                  <th className="py-3 px-4 border-b">Duration</th>
                  <th className="py-3 px-4 border-b">Plan</th>
                  <th className="py-3 px-4 border-b text-right">Amount</th>
                  <th className="py-3 px-4 border-b text-center">Action</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {billingHistory.map((bill) => (
                  <tr key={bill._id}>
                    <td className="py-3 px-4 border-b font-medium">
                      {bill.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 border-b">
                      {formatDateAsNumber(bill?.createdAt)}
                    </td>
                    <td className="py-3 px-4 border-b">
                      {formatDateAsNumber(bill?.startDate || bill?.createdAt)}
                    </td>
                    <td className="py-3 px-4 border-b">
                      {formatDateAsNumber(bill?.expiryDate)}
                    </td>
                    <td className="py-3 px-4 border-b">
                      {formatBillingType(bill?.billingType)}
                    </td>
                    <td className="py-3 px-4 border-b capitalize">
                      {bill?.durationType}
                    </td>
                    <td className="py-3 px-4 border-b">{bill?.plan?.name}</td>
                    <td className="py-3 px-4 border-b text-right font-semibold">
                      {"\u20B9"} {bill?.amount}
                    </td>
                    <td className="py-3 px-4 border-b text-center">
                      <button
                        onClick={() => downloadPDF(bill)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <img
                          src={DownloadIcon}
                          alt="Download"
                          className="h-5 w-5 mx-auto"
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- Responsive Pagination Section --- */}
        {hasHistory && (
          <div className="mt-6 flex flex-col items-center justify-between gap-4 md:flex-row">
            <Pagination
              onChange={(e, newPage) => setPage(newPage)}
              count={totalPages || 1}
              page={Number(page) || 1}
              variant="outlined"
              shape="rounded"
              size={isSmallScreen ? "small" : "medium"}
            />
            <PageLimitEditor setPage={setPage} pageId={"billingHistory"} />
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingHistory;

const StatRow = ({ label, value, className="" }) => (
  <div className="flex justify-between py-2 text-sm">
    <dt className="text-gray-500">{label}</dt>
    <dd className={`font-medium text-gray-800 text-right ${className}`}>{value}</dd>
  </div>
);

// Helper to format the billing type string
const formatBillingType = (type) => {
  if (!type) return "-";
  return type.split("_").join(" ");
};

// The new, more detailed BillingCard component
const BillingCard = ({ bill, onDownload }) => {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      {/* Card Header: Main Info */}
      <div className="flex items-start justify-between gap-4 border-b pb-3 mb-3">
        <div>
          <p className="font-semibold text-gray-900">
            {bill?.plan?.name || "N/A"}
          </p>
          <p className="text-xs text-gray-500">Invoice: {bill.invoiceNumber}</p>
        </div>
        <p className="flex-shrink-0 text-lg font-bold text-gray-900">
          {"\u20B9"}
          {bill?.amount}
        </p>
      </div>

      {/* Card Body: Details organized in a definition list */}
      <dl className="divide-y divide-gray-100">
        <StatRow
          label="Duration"
          value={`${formatDateAsNumber(
            bill?.startDate || bill?.createdAt
          )} - ${formatDateAsNumber(bill?.expiryDate)}`}
        />
        <StatRow
          label="Billing Type"
          className="capitalize"
          value={formatBillingType(bill?.billingType)}
        />
        <StatRow
          label="Duration Type"
          className="capitalize"
          value={bill?.durationType || "-"}
        />
      </dl>

      {/* Card Footer: Creation Date & Action */}
      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <span className="text-xs text-gray-500">
          Created: {formatDateAsNumber(bill?.createdAt)}
        </span>
        <button
          onClick={() => onDownload(bill)}
          className="rounded-full p-2 transition-colors hover:bg-gray-100"
          aria-label={`Download invoice ${bill.invoiceNumber}`}
        >
          <img src={DownloadIcon} alt="Download" className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
