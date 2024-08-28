import dbConnect from "@/lib/dbConnect";
import { taskModel } from "@/model/Model";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";

export async function PUT(request, { params }) {
  await dbConnect();
  const { id } = params;
  try {
    const { title, description, dueDate, priority, reminders } =
      await request.json();
    const { userId } = auth();
    if (!userId) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const updatedTask = await taskModel.findOneAndUpdate(
      { _id: id, owner: userId },
      {
        title,
        description,
        dueDate,
        priority,
        reminders,
      },
      { new: true }
    );

    return Response.json({ success: true, data: updatedTask }, { status: 200 });
  } catch (error) {
    console.log("error updating task", error);
    return Response.json(
      { success: false, message: "error updating task" },
      { status: 500 }
    );
  }
}

export async function DELETE(_, { params }) {
  await dbConnect();
  const { id } = params;
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const deletedTask = await taskModel.findOneAndDelete({
      _id: id,
      owner: userId,
    });

    return Response.json({ success: true, data: deletedTask }, { status: 200 });
  } catch (error) {
    console.log("error deleting task", error);
    return Response.json(
      { success: false, message: "error deleting task" },
      { status: 500 }
    );
  }
}

export async function GET(_, { params }) {
  await dbConnect();
  const { id } = params;
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const task = await taskModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "projects",
          localField: "project",
          foreignField: "_id",
          as: "projectDetails",
          pipeline: [
            {
              $project: {
                _id: 1,
                projectName: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          title: 1,
          description: 1,
          dueDate: 1,
          priority: 1,
          labels: 1,
          isCompleted: 1,
          reminders: 1,
          project: { $first: "$projectDetails" },
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    return Response.json(
      { success: true, data: task[0], message: "task fetched successfully" },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { success: false, message: "error fetching task" },
      { status: 500 }
    );
  }
}
