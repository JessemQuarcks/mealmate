import Order from "@/models/order";
import mongodbConnect from "@/utils/mongoConnect";
import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";



export async function POST(req:NextRequest, res:NextApiResponse) {
    await mongodbConnect();
        try {
            const body= await req.json();
            const { products} =body;

            let order = new Order ({ products });
            const savedOrder = await order.save();
            return NextResponse.json(savedOrder);
            
            }
            
            catch (error) {
            return NextResponse.json({error, message: "Something went wrong"});
            }
    }
// export async function GET(req:NextApiRequest, res:NextApiResponse){
//     await mongodbConnect();
//     return NextResponse.json({ message: ["We are getting there"] });
// }



export async function GET(req: NextRequest, res: NextResponse) {
  try {
    await mongodbConnect();
    const orders = await Order.find({});
    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ message: "Failed to fetch orders" }, { status: 500 });
  }
}
