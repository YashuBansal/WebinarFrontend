import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import { splitAddressIntoTwoLines } from "./invoiceAddress";

export const generateInvoicePdf = async ({
  bill,
  templatePath = "/invoice-2.pdf",
  billToName,
  onMissingAddress,
}) => {
  if (!bill?.admin) {
    toast.error("Admin Data is required to download the PDF");
    return;
  }

  if (!bill?.admin?.address) {
    if (onMissingAddress) {
      onMissingAddress();
    } else {
      toast.error("Address is required to download the PDF");
    }
    return;
  }

  if (!bill?.date) {
    toast.error("Invalid Date");
    return;
  }

  try {
    // Load the empty PDF template
    const existingPdfBytes = await fetch(templatePath).then((res) =>
      res.arrayBuffer()
    );
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const page = pdfDoc.getPages()[0];

    // High-resolution text rendering with Poppins font
    const createTextImage = (
      text,
      fontSize = 12,
      fontWeight = "normal",
      color = "#000000"
    ) => {
      // Use high DPI for crisp text
      const scale = 2; // 2x resolution for sharp text
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

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
      ctx.textRenderingOptimization = "optimizeQuality";
      ctx.imageSmoothingEnabled = false;

      // Clear canvas
      ctx.clearRect(
        0,
        0,
        textWidth + padding * 2,
        textHeight + padding * 2
      );

      // Set font and color
      ctx.font = `${fontWeight} ${fontSize}px Poppins, Arial, sans-serif`;
      ctx.fillStyle = color;
      ctx.textBaseline = "top";
      ctx.textAlign = "left";

      // Draw text with proper positioning
      ctx.fillText(text, padding, padding);

      return canvas.toDataURL("image/png");
    };

    // Wait for Poppins font to load
    await document.fonts.load("12px Poppins");
    await document.fonts.load("bold 12px Poppins");
    // console.log("Poppins font loaded, using high-resolution canvas rendering");

    // Helper function to format currency
    // Use the same Rupee symbol as elsewhere in the app
    const formatINR = (amount) => `\u20B9 ${amount}`;

    // Helper function to format date
    const formatDate = (date) => {
      const d = new Date(date);
      return `${String(d.getDate()).padStart(2, "0")} ${d.toLocaleString(
        "default",
        { month: "short" }
      )} ${d.getFullYear()}`;
    };

    // Helper function to draw text as image (right-aligned)
    const drawRightString = async (
      text,
      x,
      y,
      fontSize = 12,
      fontWeight = "normal"
    ) => {
      const textImage = createTextImage(text, fontSize, fontWeight);
      const imageBytes = await fetch(textImage).then((res) =>
        res.arrayBuffer()
      );
      const image = await pdfDoc.embedPng(imageBytes);

      // Calculate dimensions for right alignment
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
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

    // Helper to measure text width for Poppins
    const measureTextWidth = (
      text,
      fontSize = 12,
      fontWeight = "normal"
    ) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      ctx.font = `${fontWeight} ${fontSize}px Poppins, Arial, sans-serif`;
      const metrics = ctx.measureText(text);
      return Math.ceil(metrics.width);
    };

    // Helper function to draw text as image (left-aligned)
    const drawString = async (
      text,
      x,
      y,
      fontSize = 12,
      fontWeight = "normal",
      color = "#000000"
    ) => {
      const textImage = createTextImage(text, fontSize, fontWeight, color);
      const imageBytes = await fetch(textImage).then((res) =>
        res.arrayBuffer()
      );
      const image = await pdfDoc.embedPng(imageBytes);

      // Calculate dimensions
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
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

    // Header / Top-right coordinates (canonical BillingHistory layout)
    await drawString(bill?.invoiceNumber || "", 460, 688, 10);
    await drawString(formatDate(bill?.date), 460, 668, 10);
    await drawRightString(formatINR(bill?.amount), 494, 648, 10);
    await drawString("PAID", 420, 628, 12, "bold", "#00AA00");

    // Billing period
    const startDate = new Date(bill?.startDate || bill?.createdAt);
    const expiryDate = new Date(bill?.expiryDate);
    const billingPeriod = `Billing Period: ${formatDate(
      startDate
    )} to ${formatDate(expiryDate)}`;
    await drawString(billingPeriod, 35, 660, 11);

    // Bill To section (left column)
    const resolvedBillToName =
      billToName || bill?.admin?.companyName || "Company Name";
    await drawString(resolvedBillToName, 35, 470, 12, "bold");

    const rawAddress = bill?.admin?.address?.trim();
    const addressLinesToDraw = splitAddressIntoTwoLines(rawAddress);

    for (let index = 0; index < addressLinesToDraw.length; index++) {
      await drawString(addressLinesToDraw[index], 35, 450 - index * 20, 12);
    }

    let currentY = 470 - addressLinesToDraw.length * 20;

    if (bill?.admin?.gst) {
      const gstLabel = "GSTIN: ";
      const gstFontSize = 12;
      const gstY = currentY - 20;
      const gstLabelWidth = measureTextWidth(gstLabel, gstFontSize);

      await drawString(gstLabel, 35, gstY, gstFontSize);
      await drawString(
        bill?.admin?.gst,
        35 + gstLabelWidth + 4,
        gstY,
        gstFontSize,
        "bold"
      );

      currentY -= 20;
    }

    await drawString(bill?.admin?.email || "Email", 35, currentY - 20, 12);
    await drawString(bill?.admin?.phone || "Phone", 35, currentY - 40, 12);

    // Item/Service table
    const tableY = 295;

    // Item description
    const description = bill.addOn
      ? `${bill.addOn.addonName} (Add-On)`
      : `${bill.plan.name} (Plan)`;
    await drawString(description, 35, tableY, 12);

    // Totals block (bottom-right)
    const subtotalAmount = bill.itemAmount - bill.discountAmount;
    await drawRightString(formatINR(subtotalAmount), 520, tableY, 12, "bold");
    await drawRightString(
      formatINR(subtotalAmount),
      520,
      tableY - 45,
      12,
      "bold"
    );

    await drawRightString(
      formatINR(bill.taxAmount),
      514,
      tableY - 67,
      12,
      "bold"
    );

    await drawRightString(formatINR(bill.amount), 507, tableY - 104, 14, "bold");

    // Payment details
    const paymentDate = new Date(bill?.date);
    const formattedPaymentDate = `${formatDate(paymentDate)} ${String(
      paymentDate.getHours()
    ).padStart(2, "0")}:${String(paymentDate.getMinutes()).padStart(
      2,
      "0"
    )} IST`;
    await drawString(
      `${formatINR(bill.amount)} was paid on ${formattedPaymentDate}`,
      52,
      110,
      12
    );

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();

    // Create blob and download
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    const invoiceDate = new Date(bill?.date);
    const formattedInvoiceDate = `${String(invoiceDate.getDate()).padStart(
      2,
      "0"
    )}-${String(invoiceDate.getMonth() + 1).padStart(
      2,
      "0"
    )}-${invoiceDate.getFullYear()}`;
    const filename = `Invoice_${bill?.invoiceNumber || "Unknown"}_${formattedInvoiceDate.replace(
      /-/g,
      "_"
    )}.pdf`;

    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error generating PDF:", error);
    toast.error("Failed to generate PDF");
  }
};

