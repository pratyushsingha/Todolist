import { getMongoosePaginationOptions } from "@/helpers/pagination";
import dbConnect from "@/lib/dbConnect";
import { taskModel } from "@/model/Model";
import { auth } from "@clerk/nextjs/server";

export async function POST(request) {
  await dbConnect();
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json("Unauthorized", { status: 401 });
    }
    const { title, description, dueDate, priority, reminders } =
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

export async function GET(request) {

  await dbConnect();
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json("Unauthorized", { status: 401 });
    }

    const allTasksAggregate = taskModel.aggregate([
      {
        $match: {
          owner: userId,
          dueDate: {
            $gte: new Date(),
          },
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
        },
      },
    ]);

    if (!allTasksAggregate) {
      return Response.json(
        { success: false, message: "No tasks found" },
        { status: 404 }
      );
    }

    const allTasks = await taskModel.aggregatePaginate(
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
  } catch (error) {
    console.log("error fetching today's tasks", error);
    return Response.json(
      { success: false, message: "error fetching today's tasks" },
      { status: 500 }
    );
  }
}
