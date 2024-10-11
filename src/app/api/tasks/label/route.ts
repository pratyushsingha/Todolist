import dbConnect from "@/lib/dbConnect";
import { labelModel } from "@/model/Model";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  await dbConnect();
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const labels = await labelModel.find({ owner: userId }).select("_id name");
    return Response.json(
      { success: true, data: labels, message: "lables fetched successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return Response.json(
      { success: false, message: "Error fetching the labels" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  await dbConnect();
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const { name, color } = await request.json();
    if (!name) {
      return Response.json(
        { success: false, message: "label name is missing" },
        { status: 400 }
      );
    }
    const label = new labelModel({
      name,
      color,
      owner: userId,
    });
    await label.save();

    return Response.json(
      { success: true, data: label, message: "label created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.log(error);
    return Response.json(
      { success: false, message: "Error creating the label" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const labelId = searchParams.get("labelId");
  try {
    const { name, color } = await request.json();
    const { userId } = auth();
    if (!userId) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const updatedLabel = await labelModel.findOneAndUpdate(
      { _id: labelId, owner: userId },
      {
        name,
        color,
      },
      { new: true }
    );

    return Response.json(
      {
        success: true,
        data: updatedLabel,
        message: "label updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return Response.json(
      { success: false, message: "Error updating the label" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const labelId = searchParams.get("labelId");
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    await labelModel.deleteOne({ _id: labelId, owner: userId });
    return Response.json(
      { success: true, message: "label deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return Response.json(
      { success: false, message: "Error deleting the label" },
      { status: 500 }
    );
  }
}
