import dbConnect from "@/lib/dbConnect";
import { taskModel } from "@/model/Model";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const weekStartDate = searchParams.get("weekStartDate");
  await dbConnect();
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    if (!weekStartDate) {
      return Response.json(
        { success: false, message: "Invalid week start date" },
        { status: 400 }
      );
    }
    const firstDateOfWeek = new Date(weekStartDate);
    firstDateOfWeek.setHours(0, 0, 0, 0);

    const lastDateOfWeek = new Date(firstDateOfWeek);
    lastDateOfWeek.setDate(firstDateOfWeek.getDate() + 6);

    console.log(firstDateOfWeek, lastDateOfWeek);

    const upcomingTasks = await taskModel.aggregate([
      {
        $match: {
          dueDate: {
            $gte: firstDateOfWeek,
            $lte: lastDateOfWeek,
          },
          isCompleted: false,
        },
      },
      {
        $group: {
          _id: "$dueDate",
          tasks: { $push: "$$ROOT" },
          taskCount: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    return Response.json(
      {
        success: true,
        data: upcomingTasks,
        message: "Upcoming tasks fetched successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return Response.json(
      { success: false, message: "Error fetching upcoming tasks" },
      { status: 500 }
    );
  }
}
