import React from "react";
import {
  Search,
  Clock,
  PhoneForwarded,
  ThumbsUp,
  BellRing,
  CheckCircle2,
  PhoneOff,
  AlertCircle,
  ClipboardList,
  PhoneCall,
  Hourglass,
  ThumbsDown,
} from "lucide-react";

const iconProps = (color) => ({ size: 16, color, strokeWidth: 2.5 });

export function getIconConfig(label, color) {
  const props = iconProps(color);
  const lower = String(label || "").toLowerCase();

  if (lower.includes("worked")) {
    return { icon: <Clock {...props} />, anim: "animate-float" };
  }
  if (lower.includes("follow-up")) {
    return { icon: <PhoneForwarded {...props} />, anim: "animate-bounce-subtle" };
  }
  if (lower.includes("not interested")) {
    return { icon: <ThumbsDown {...props} />, anim: "" };
  }
  if (lower.includes("interested")) {
    return { icon: <ThumbsUp {...props} />, anim: "animate-pulse-subtle" };
  }
  if (lower.includes("alarm")) {
    return { icon: <BellRing {...props} />, anim: "animate-wiggle" };
  }
  if (lower.includes("purchased") || lower.includes("converted")) {
    return { icon: <CheckCircle2 {...props} />, anim: "animate-float" };
  }
  if (lower.includes("wrong")) {
    return { icon: <PhoneOff {...props} />, anim: "" };
  }
  if (lower.includes("invalid")) {
    return { icon: <AlertCircle {...props} />, anim: "" };
  }
  if (lower.includes("assignments")) {
    return { icon: <ClipboardList {...props} />, anim: "" };
  }
  if (lower.includes("valid calls")) {
    return { icon: <PhoneCall {...props} />, anim: "animate-wiggle" };
  }
  if (lower.includes("pending") || lower.includes("later")) {
    return { icon: <Hourglass {...props} />, anim: "animate-pulse-subtle" };
  }

  return { icon: <Search {...props} />, anim: "" };
}

export function statusToAccentColor(label) {
  if (!label) return "#64748b";
  const lower = String(label).toLowerCase();
  if (lower.includes("follow")) return "#FF6B35";
  if (lower.includes("interested")) return "#22B573";
  if (lower.includes("alarm")) return "#3b82f6";
  if (lower.includes("purchased") || lower.includes("converted")) return "#8b5cf6";
  if (lower.includes("wrong")) return "#ef4444";
  if (lower.includes("invalid")) return "#f59e0b";
  if (lower.includes("not interested")) return "#64748b";
  if (lower.includes("later") || lower.includes("pending")) return "#f59e0b";
  return "#22B573";
}
