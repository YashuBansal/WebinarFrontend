import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
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

  const [page, setPage] = useState(1);
  const LIMIT = useSelector(
    (state) => state.pageLimits["billingHistory"] || 10
  );

  useEffect(() => {
    dispatch(getAdminBillingHistory({ page, limit: LIMIT }));
  }, [page, LIMIT]);

  useEffect(() => {
    dispatch(getSuperAdmin());
  }, []);

  const downloadPDF = async (bill) => {
    if (!bill?.admin) {
      toast.error("Admin Data is required to download the PDF");
      return;
    }


    if (!bill?.admin?.address) {
      toast.error("Address is required to download the PDF");
      navigate("/profile");
      return;
    }

    if (!bill?.date) {
      toast.error("Invalid Date");
      return;
    }

    try {
      // Load the empty PDF template
      const existingPdfBytes = await fetch('/Invoice.pdf').then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      const page = pdfDoc.getPages()[0];
      const { width, height } = page.getSize();

      // High-resolution text rendering with Poppins font
      const createTextImage = (text, fontSize = 12, fontWeight = 'normal', color = '#000000') => {
        // Use high DPI for crisp text
        const scale = 2; // 2x resolution for sharp text
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set font first to measure text properly
        ctx.font = `${fontWeight} ${fontSize}px Poppins, Arial, sans-serif`;
        const metrics = ctx.measureText(text);

        // Calculate proper canvas dimensions
        const textWidth = Math.ceil(metrics.width);
        const textHeight = fontSize;
        const padding = 10;

        // Set canvas size with high DPI
        canvas.width = (textWidth + padding * 2) * scale;
        canvas.height = (textHeight + padding * 2) * scale;

        // Scale context for high DPI
        ctx.scale(scale, scale);

        // Enable text rendering optimizations
        ctx.textRenderingOptimization = 'optimizeQuality';
        ctx.imageSmoothingEnabled = false;

        // Clear canvas
        ctx.clearRect(0, 0, textWidth + padding * 2, textHeight + padding * 2);

        // Set font and color
        ctx.font = `${fontWeight} ${fontSize}px Poppins, Arial, sans-serif`;
        ctx.fillStyle = color;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';

        // Draw text with proper positioning
        ctx.fillText(text, padding, padding);

        return canvas.toDataURL('image/png');
      };

      // Wait for Poppins font to load
      await document.fonts.load('12px Poppins');
      await document.fonts.load('bold 12px Poppins');
      console.log('Poppins font loaded, using high-resolution canvas rendering');

      // Helper function to format currency
      const formatINR = (amount) => `₹ ${amount}`;

      // Helper function to format date
      const formatDate = (date) => {
        const d = new Date(date);
        return `${String(d.getDate()).padStart(2, "0")} ${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
      };

      // Helper function to draw text as image (right-aligned)
      const drawRightString = async (text, x, y, fontSize = 12, fontWeight = 'normal') => {
        const textImage = createTextImage(text, fontSize, fontWeight);
        const imageBytes = await fetch(textImage).then(res => res.arrayBuffer());
        const image = await pdfDoc.embedPng(imageBytes);

        // Calculate dimensions for right alignment
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = `${fontWeight} ${fontSize}px Poppins, Arial, sans-serif`;
        const metrics = ctx.measureText(text);
        const textWidth = Math.ceil(metrics.width);
        const textHeight = fontSize;
        const padding = 10;

        page.drawImage(image, {
          x: x - textWidth - padding,
          y: y - padding,
          width: textWidth + padding * 2,
          height: textHeight + padding * 2,
        });
      };

      // Helper function to draw text as image (left-aligned)
      const drawString = async (text, x, y, fontSize = 12, fontWeight = 'normal') => {
        const textImage = createTextImage(text, fontSize, fontWeight);
        const imageBytes = await fetch(textImage).then(res => res.arrayBuffer());
        const image = await pdfDoc.embedPng(imageBytes);

        // Calculate dimensions
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = `${fontWeight} ${fontSize}px Poppins, Arial, sans-serif`;
        const metrics = ctx.measureText(text);
        const textWidth = Math.ceil(metrics.width);
        const textHeight = fontSize;
        const padding = 10;

        page.drawImage(image, {
          x: x - padding,
          y: y - padding,
          width: textWidth + padding * 2,
          height: textHeight + padding * 2,
        });
      };

      // Header / Top-right coordinates
      await drawString(bill?.invoiceNumber || "", 460, 688, 10);
      await drawString(formatDate(bill?.date), 460, 668, 10);
      await drawRightString(formatINR(bill?.amount), 490, 648, 10);
      await drawString("PAID", 420, 628, 12, 'bold');

      // Billing period
      const startDate = new Date(bill?.startDate || bill?.createdAt);
      const expiryDate = new Date(bill?.expiryDate);
      const billingPeriod = `${formatDate(startDate)} to ${formatDate(expiryDate)}`;
      await drawString(billingPeriod, 420, 510, 11);

      // Bill To section (left column)
      await drawString(bill?.admin?.companyName || "Company Name", 35, 510, 12, 'bold');

      // Split address into lines
      const addressLines = bill?.admin?.address.split(', ');
      for (let index = 0; index < addressLines.length; index++) {
        await drawString(addressLines[index], 35, 492 - (index * 20), 12);
      }

      let currentY = 510 - (addressLines.length * 20);

      if (bill?.admin?.gst) {
        await drawString(`GSTIN: ${bill?.admin?.gst}`, 35, currentY - 20, 12);
        currentY -= 20;
      }

      await drawString(bill?.admin?.email || "Email", 35, currentY - 20, 12);
      await drawString(bill?.admin?.phone || "Phone", 35, currentY - 40, 12);

      // Item/Service table
      const tableY = 328;
      // drawString("ITEM/SERVICE", 35, tableY, helveticaBoldFont, 12);
      // drawString("1", 360, tableY, helveticaFont, 10); // Qty
      // drawRightString(formatINR(bill.itemAmount), 430, tableY, helveticaFont, 10); // Unit price
      // drawRightString(formatINR(bill.itemAmount), 520, tableY, helveticaFont, 10); // Line total

      // Item description
      const description = bill.addOn
        ? `${bill.addOn.addonName} (Add-On)`
        : `${bill.plan.name} (Plan)`;
      await drawString(description, 35, tableY, 12);

      // Totals block (bottom-right)
      const subtotalAmount = bill.itemAmount - bill.discountAmount;
      await drawRightString(formatINR(subtotalAmount), 520, tableY, 12, 'bold');
      await drawRightString(formatINR(subtotalAmount), 520, tableY - 45, 12, 'bold');

      await drawRightString(formatINR(bill.taxAmount), 520, tableY - 67, 12, 'bold');

      await drawRightString(formatINR(bill.amount), 514, tableY - 104, 14, 'bold');

      // Payment details
      const paymentDate = new Date(bill?.date);
      const formattedPaymentDate = `${formatDate(paymentDate)} ${String(paymentDate.getHours()).padStart(2, "0")}:${String(paymentDate.getMinutes()).padStart(2, "0")} IST`;
      await drawString(`${formatINR(bill.amount)} was paid on ${formattedPaymentDate}`, 52, 110, 12);

      // Notes

      // Generate PDF bytes
      const pdfBytes = await pdfDoc.save();

      // Create blob and download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const invoiceDate = new Date(bill?.date);
      const formattedInvoiceDate = `${String(invoiceDate.getDate()).padStart(2, "0")}-${String(invoiceDate.getMonth() + 1).padStart(2, "0")}-${invoiceDate.getFullYear()}`;
      const filename = `Invoice_${bill?.invoiceNumber || 'Unknown'}_${formattedInvoiceDate.replace(/-/g, '_')}.pdf`;

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
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

const StatRow = ({ label, value, className = "" }) => (
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
