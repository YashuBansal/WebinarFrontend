import {
  CalendarDays,
  Cloud,
  MessageCircle,
  Package,
  Shield,
  UserRound,
  Users,
  Video,
  Zap,
} from "lucide-react";

/** Pick a Lucide icon from add-on name / limits (matches “Frontend UI New” vibe). */
export function pickAddonIcon(addon) {
  const name = (addon?.addonName || "").toLowerCase();
  if (name.includes("whatsapp")) return MessageCircle;
  if (name.includes("zoom")) return Video;
  if (name.includes("webinar")) return CalendarDays;
  if (name.includes("employee")) return Users;
  if (name.includes("contact")) return UserRound;
  if (name.includes("storage") || name.includes("record")) return Cloud;
  if (name.includes("brand") || name.includes("logo") || name.includes("white")) return Shield;
  if (name.includes("ai") || name.includes("insight") || name.includes("analytic")) return Zap;
  if (addon?.whatsappProjectLimit) return MessageCircle;
  if (addon?.zoomProjectLimit) return Video;
  if (addon?.webinarLimit) return CalendarDays;
  if (addon?.employeeLimit) return Users;
  if (addon?.contactLimit) return UserRound;
  return Package;
}

export function buildAddonDescription(addon) {
  const limits = [];
  if (addon?.employeeLimit) limits.push(`${addon.employeeLimit} employees`);
  if (addon?.contactLimit) limits.push(`${addon.contactLimit} contacts`);
  if (addon?.webinarLimit) limits.push(`${addon.webinarLimit} webinars`);
  if (addon?.whatsappProjectLimit) {
    limits.push(`${addon.whatsappProjectLimit} WhatsApp projects`);
  }
  if (addon?.zoomProjectLimit) limits.push(`${addon.zoomProjectLimit} Zoom projects`);
  if (!limits.length) {
    return "Extend limits and capacity for your workspace.";
  }
  return limits.join(" · ");
}
