import { getOrderModel } from "@/models/OrderModel";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, res: NextResponse) {
  try {
    const Order = await getOrderModel();

    if (!Order) {
      throw new Error("Order model is not initialized");
    }

    const orders = await Order.find({});
    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ message: "Failed to fetch orders" }, { status: 500 });
  }
}
