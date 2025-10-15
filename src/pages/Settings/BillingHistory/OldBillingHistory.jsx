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

  const downloadPDF = async (bill) => {
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
    
    // Colors matching the invoice design
    const darkGray = [45, 45, 45]; // Dark gray for headers
    const green = [34, 197, 94]; // Green for accents
    const white = [255, 255, 255]; // White for text on colored backgrounds

    let YAxis = 0;

    // Header Section - Dark gray left section with rounded corners
    doc.setFillColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.rect( 7, YAxis, 196, 10,'F');
    doc.rect( 7, YAxis, 100, 20,'F');
    doc.roundedRect(7, YAxis, 115, 40, 8, 8,'F'); // Rounded rectangle with 8px radius
    
    // Add logo image in the center
    try {
      // Load the logo image
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      
      // Create a promise to handle the image loading
      const loadImage = () => {
        return new Promise((resolve, reject) => {
          logoImg.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = logoImg.width;
            canvas.height = logoImg.height;
            ctx.drawImage(logoImg, 0, 0);
            const logoDataURL = canvas.toDataURL('image/png');
            resolve(logoDataURL);
          };
          logoImg.onerror = reject;
          logoImg.src = '/smlogo.png';
        });
      };
      
      // Load image and add to PDF
      const logoDataURL = await loadImage();
      doc.addImage(logoDataURL, 'PNG', 15, YAxis + 9, 22, 27);
      
    } catch (error) {
      console.log('Could not load logo image, using text fallback');
      // Fallback: Draw a simple logo representation
      doc.setFillColor(white[0], white[1], white[2]);
      doc.rect(60, YAxis + 10, 20, 20, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.text("LOGO", 65, YAxis + 22);
    }

    doc.setTextColor(white[0], white[1], white[2]);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("WEBINAR", 40, YAxis + 18);
    doc.text("LEADS", 40, YAxis + 28);
    
    // "HUB" in green
    doc.setTextColor(green[0], green[1], green[2]);
    doc.text("HUB", 70, YAxis + 28);


    // Company name text next to logo
   

    // INVOICE title on the right (white background area)
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(36);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", 210, YAxis + 25, { align: "right" });

    YAxis += 50;

    // Invoice details section
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Invoice number and date
    doc.text("INVOICE #", 200, YAxis, { align: "right" });
    doc.text(bill?.invoiceNumber || "", 200, YAxis + 5, { align: "right" });
    
    doc.text("INVOICE DATE:", 200, YAxis + 12, { align: "right" });
    const invoiceDate = new Date(bill?.date);
    const formattedInvoiceDate = `${String(invoiceDate.getDate()).padStart(2, "0")}-${String(invoiceDate.getMonth() + 1).padStart(2, "0")}-${invoiceDate.getFullYear()}`;
    doc.text(formattedInvoiceDate, 200, YAxis + 17, { align: "right" });
    
    doc.text("INVOICE AMOUNT:", 200, YAxis + 24, { align: "right" });
    doc.text(`₹${bill?.amount}`, 200, YAxis + 29, { align: "right" });
    
    // Payment status
    doc.setTextColor(green[0], green[1], green[2]);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PAID", 200, YAxis + 40, { align: "right" });
    doc.setTextColor(0, 0, 0);

    YAxis += 50;

    // Company information section
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("WEBINAR LEADS HUB", 15, YAxis);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    YAxis += 5;
    
    // Split address into lines
    const addressLines = superAdminData.address.split(', ');
    addressLines.forEach((line, index) => {
      doc.text(line, 15, YAxis + (index * 4));
    });
    
    YAxis += addressLines.length * 4 + 5;
    
    if (superAdminData?.gst) {
      doc.text(`GSTIN: ${superAdminData.gst}`, 15, YAxis);
      YAxis += 5;
    }

    // Billed To section
    YAxis += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("BILLED TO", 15, YAxis);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    YAxis += 5;
    
    doc.text(userData?.companyName || "Company Name", 15, YAxis);
    YAxis += 4;
    doc.text(userData?.email || "Email", 15, YAxis);
    YAxis += 4;
    doc.text(userData?.phone || "Phone", 15, YAxis);
    YAxis += 4;
    
    // Split user address into lines
    const userAddressLines = userData.address.split(', ');
    userAddressLines.forEach((line, index) => {
      doc.text(line, 15, YAxis + (index * 4));
    });
    
    YAxis += userAddressLines.length * 4 + 5;
    
    if (userData?.gst) {
      doc.text(`GSTIN: ${userData.gst}`, 15, YAxis);
      YAxis += 5;
    }

    // Subscription section on the right
    const subscriptionY = YAxis - (userAddressLines.length * 4) - 15;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("SUBSCRIPTION", 200, subscriptionY, { align: "right" });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    const startDate = new Date(bill?.startDate || bill?.createdAt);
    const expiryDate = new Date(bill?.expiryDate);
    const billingPeriod = `${String(startDate.getDate()).padStart(2, "0")} ${startDate.toLocaleString('default', { month: 'short' })} to ${String(expiryDate.getDate()).padStart(2, "0")} ${expiryDate.toLocaleString('default', { month: 'short' })}, ${expiryDate.getFullYear()}`;
    
    doc.text(`Billing Period— ${billingPeriod}`, 200, subscriptionY + 5, { align: "right" });

    YAxis += 20;

    // Items table header with green background
    doc.setFillColor(green[0], green[1], green[2]);
    doc.rect(15, YAxis, 180, 8, 'F');
    
    doc.setTextColor(white[0], white[1], white[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("DESCRIPTION", 20, YAxis + 6);
    doc.text("TOTAL", 200, YAxis + 6, { align: "right" });
    
    YAxis += 12;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    
    // Item description
    const description = bill.addOn
      ? `${bill.addOn.addonName} (Add-On)`
      : `${bill.plan.name} (Plan)`;
    
    doc.text("ITEM/SERVICE", 20, YAxis);
    doc.text(`₹${bill.itemAmount}`, 200, YAxis, { align: "right" });

    YAxis += 20;

    // Summary section
    doc.setFontSize(9);
    doc.text("SUB-TOTAL", 170, YAxis, { align: "right" });
    doc.text(`₹${bill.itemAmount - bill.discountAmount}`, 200, YAxis, { align: "right" });
    
    YAxis += 5;
    doc.text(`IGST @ ${GST_VALUE}%`, 170, YAxis, { align: "right" });
    doc.text(`₹${bill.taxAmount}`, 200, YAxis, { align: "right" });
    
    YAxis += 8;
    
    // Total with green background
    doc.setFillColor(green[0], green[1], green[2]);
    doc.rect(150, YAxis - 3, 50, 8, 'F');
    
    doc.setTextColor(white[0], white[1], white[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Total", 170, YAxis + 2, { align: "right" });
    doc.text(`₹${bill.amount}`, 200, YAxis + 2, { align: "right" });

    YAxis += 20;
    doc.setTextColor(0, 0, 0);

    // Payments section
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENTS", 15, YAxis);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    YAxis += 5;
    
    const paymentDate = new Date(bill?.date);
    const formattedPaymentDate = `${String(paymentDate.getDate()).padStart(2, "0")} ${paymentDate.toLocaleString('default', { month: 'short' })}, ${paymentDate.getFullYear()} ${String(paymentDate.getHours()).padStart(2, "0")}:${String(paymentDate.getMinutes()).padStart(2, "0")} IST`;
    doc.text(`₹${bill.amount} was paid on ${formattedPaymentDate}`, 15, YAxis);

    // Footer
    YAxis = 280;
    doc.setFillColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.roundedRect(15, YAxis, 180, 15, 3, 3, 'F');
    
    doc.setTextColor(white[0], white[1], white[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Webinar Leads Hub - All Leads. One Dashboard.", 105, YAxis + 10, { align: "center" });

    // Generate filename with invoice number
    const filename = `Invoice_${bill?.invoiceNumber || 'Unknown'}_${formattedInvoiceDate.replace(/-/g, '_')}.pdf`;
    doc.save(filename);
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
