import dbConnect from "@/lib/dbConnect";
import { taskModel } from "@/model/Model";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";

export async function POST(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("taskId");
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const task = await taskModel.findById(taskId);
    if (!task) {
      return Response.json(
        { success: false, message: "task not found" },
        { status: 401 }
      );
    }
    const { title, description, dueDate, priority, reminders } =
      await request.json();
    if (!title) {
      return Response.json(
        { success: false, message: "title is missing" },
        { status: 400 }
      );
    }

    const subtask = new taskModel({
      title,
      description,
      dueDate,
      priority,
      reminders,
      owner: userId,
      taskId,
    });

    await subtask.save();
    return Response.json(
      { success: true, data: subtask, message: "subtask created successfully" },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { success: false, message: "error creating task" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const subtaskId = searchParams.get("subtaskId");
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const { title, description, dueDate, priority, reminders } =
      await request.json();
    const updatedTask = await taskModel.findOneAndUpdate(
      { _id: subtaskId, owner: userId },
      {
        title,
        description,
        dueDate,
        priority,
        reminders,
      },
      { new: true }
    );

    return Response.json(
      {
        success: true,
        data: updatedTask,
        message: "subtask updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { success: false, message: "error updating task" },
      { status: 500 }
    );
  }
}

export async function DELETE(_, { params }) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const subtaskId = searchParams.get("subtaskId");
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const task = await taskModel.findById(subtaskId);
    if (!task) {
      return Response.json(
        { success: false, message: "task not found" },
        { status: 404 }
      );
    }
    if (task.owner.toString() !== userId) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    await task.remove();
    return Response.json(
      {
        success: true,
        data: deletedTask,
        message: "subtask deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { success: false, message: "error deleting task" },
      { status: 500 }
    );
  }
}

export async function GET(_, { params }) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const subtaskId = searchParams.get("subtaskId");
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const subTasks = await taskModel.aggregate([
      {
        $match: {
          taskId: new mongoose.Types.ObjectId(subtaskId),
          isCompleted: false,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "userId",
          as: "ownerDetails",
        },
      },
      {
        $project: {
          _id: 1,
          taskId: 1,
          title: 1,
          description: 1,
          labels: 1,
          reminders: 1,
          ownerDetails: { $first: "$ownerDetails" },
          isCompleted: 1,
          dueDate: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    return Response.json(
      {
        success: true,
        data: subTasks,
        message: "subtasks fetched successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { success: false, message: "error while fetching subtasks" },
      { status: 500 }
    );
  }
}
