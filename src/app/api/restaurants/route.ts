import { getRestaurantsModel } from "@/models/restaurant"
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, res: NextResponse) {
  try {
    const body = await req.json();
    console.log("Data from Body: ", body);
    
    const Restaurants = await getRestaurantsModel();

    if (!Restaurants) {
      throw new Error("Products model is not initialized");
    }

    await Restaurants.create(body);
    return NextResponse.json({ message: ["Products inserted successfully"], success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      const errorList: string[] = [];

      for (const e in error.errors) {
        errorList.push(error.errors[e]?.message);
      }

      console.error("Mongoose Error: ", errorList);
      return NextResponse.json({ message: errorList }, { status: 500 });
    } else {
      console.error("Oops! Something out of normal flow happened:", error);
      return NextResponse.json({ message: ["Unable to send request"] }, { status: 500 });
    }
  }
}

