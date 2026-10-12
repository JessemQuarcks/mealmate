import React from "react";
import { orderStatusLabel, orderStatusStyle } from "@/lib/orderStatusLabel";

/** Small coloured pill for an order's current status, used across the app. */
const StatusBadge: React.FC<{ status: string; className?: string }> = ({
  status,
  className = "",
}) => (
  <span className={`badge ${orderStatusStyle(status)} ${className}`}>
    {orderStatusLabel(status)}
  </span>
);

export default StatusBadge;
