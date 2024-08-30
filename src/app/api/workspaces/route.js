import dbConnect from "@/lib/dbConnect";
import { workspaceModel } from "@/model/Model";
import { auth } from "@clerk/nextjs/server";

export async function POST(request) {
  await dbConnect();
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name, isTeam } = await request.json();
    if (!name) {
      return Response.json(
        { success: false, message: "name is missing" },
        { status: 400 }
      );
    }
    const workspace = new workspaceModel({
      name,
      owner: userId,
      members: [userId],
      isTeam,
    });

    await workspace.save();
    return Response.json(
      {
        success: true,
        data: workspace,
        message: "workspace created successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return Response.json(
      { success: false, message: "error creating workspace" },
      { status: 500 }
    );
  }
}

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
    const workspaceList = await workspaceModel.aggregate([
      {
        $match: {
          owner: userId,
        },
      },
      {
        $lookup: {
          from: "projects",
          localField: "_id",
          foreignField: "workspace",
          as: "projects",
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
    ]);

    return Response.json(
      {
        success: true,
        data: workspaceList,
        message: "workspaces fetched sucessfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return Response.json(
      { success: false, message: "error fetching workspaces" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const projectsOnWorkspace = await projectModel
      .find({ workspace: workspaceId })
      .select("projectName isFavourite");

    return Response.json(
      {
        success: true,
        data: projectsOnWorkspace,
        message: "projects fetched successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return Response.json(
      { success: false, message: "Error fetching the projects" },
      { status: 500 }
    );
  }
}
