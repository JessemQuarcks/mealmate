import { OrderStatus } from "@/lib/orderStatus";

/** Customer-facing label and badge colour for each order status. */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  placed: "Placed",
  accepted: "Accepted",
  rejected: "Rejected",
  preparing: "Preparing",
  ready: "Ready for pickup",
  out_for_delivery: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Tailwind classes for a status badge. */
export const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  placed: "bg-blue-100 text-blue-700",
  accepted: "bg-indigo-100 text-indigo-700",
  rejected: "bg-red-100 text-red-700",
  preparing: "bg-amber-100 text-amber-700",
  ready: "bg-emerald-100 text-emerald-700",
  out_for_delivery: "bg-teal-100 text-teal-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-gray-200 text-gray-600",
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABEL[status as OrderStatus] ?? status.replace(/_/g, " ");
}

export function orderStatusStyle(status: string): string {
  return ORDER_STATUS_STYLE[status as OrderStatus] ?? "bg-gray-100 text-gray-600";
}
