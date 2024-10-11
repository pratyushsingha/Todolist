import dbConnect from "@/lib/dbConnect";
import { taskModel } from "@/model/Model";
import { auth } from "@clerk/nextjs/server";
import { getMongoosePaginationOptions } from "@/helpers/pagination";
import mongoose from "mongoose";

export async function POST(request: Request) {
  await dbConnect();
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json("Unauthorized", { status: 401 });
    }
    const { title, description, dueDate, priority, reminders, section } =
      await request.json();
    if (!title) {
      return Response.json(
        { success: false, message: "title is missing" },
        { status: 400 }
      );
    }

    const task = new taskModel({
      title,
      description,
      dueDate,
      priority,
      reminders,
      section,
      owner: userId,
    });
    await task.save();

    return Response.json({ success: true, task }, { status: 201 });
  } catch (error) {
    console.log("error creating task", error);
    return Response.json(
      { success: false, message: "error creating task" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("taskId");
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
      { _id: taskId, owner: userId },
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

export async function DELETE(request: Request) {
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
    const deletedTask = await taskModel.findOneAndDelete({
      _id: taskId,
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

export async function GET(request: Request) {
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
    if (taskId) {
      const task = await taskModel.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(taskId),
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
    } else {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const allTasksAggregate = taskModel.aggregate([
        {
          $match: {
            owner: userId,
            dueDate: {
              $gte: startOfDay,
              $lte: endOfDay,
            },
            isCompleted: false,
          },
        },
        {
          $lookup: {
            from: "projects",
            localField: "project",
            foreignField: "_id",
            as: "project",
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
            labels: 1,
            project: { $first: "$project" },
            priority: 1,
            reminders: 1,
            isCompleted: 1,
          },
        },
      ]);

      if (!allTasksAggregate) {
        return Response.json(
          { success: false, message: "No tasks found" },
          { status: 404 }
        );
      }

      const allTasks = await (taskModel as any).aggregatePaginate(
        allTasksAggregate,
        getMongoosePaginationOptions({
          page: 1,
          limit: 20,
          customLabels: {
            totalDocs: "totalTasks",
            docs: "allTasks",
          },
        })
      );
      return Response.json({ success: true, data: allTasks }, { status: 200 });
    }
  } catch (error) {
    console.log(error);
    return Response.json(
      { success: false, message: "error fetching task" },
      { status: 500 }
    );
  }
}
