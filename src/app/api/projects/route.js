import dbConnect from "@/lib/dbConnect";
import { projectModel } from "@/model/Model";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";

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
    const { projectName, color, workspace, isFavourite } = await request.json();
    if (!projectName) {
      return Response.json(
        { success: false, message: "projectName is missing" },
        { status: 400 }
      );
    }

    const project = new projectModel({
      projectName,
      color,
      workspace,
      isFavourite,
      owner: userId,
    });

    await project.save();

    return Response.json(
      { success: true, data: project, message: "project created successfully" },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { success: false, message: "error while creating project" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const projectDetails = await projectModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(projectId),
        },
      },
      {
        $lookup: {
          from: "workspaces",
          localField: "workspace",
          foreignField: "_id",
          as: "workspaceDetails",
        },
      },
      {
        $unwind: {
          path: "$workspaceDetails",
        },
      },
      {
        $match: {
          "workspaceDetails.members": userId,
        },
      },
      {
        $lookup: {
          from: "sections",
          localField: "_id",
          foreignField: "project",
          as: "sections",
          pipeline: [
            {
              $lookup: {
                from: "tasks",
                localField: "_id",
                foreignField: "section",
                as: "tasks",
              },
            },
          ],
        },
      },
    ]);

    if (!projectDetails.length) {
      return Response.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    return Response.json(
      {
        success: true,
        data: projectDetails[0],
        message: "Project fetched successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return Response.json(
      { success: false, message: "Error fetching the project details" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const project = await projectModel.findById(projectId);
    if (!project) {
      return Response.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }
    const { projectName, color, isFavourite } = await request.json();
    project.projectName = projectName;
    project.color = color;
    project.isFavourite = isFavourite;
    await project.save();
    return Response.json(
      {
        success: true,
        data: project,
        message: "Project updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return Response.json(
      { success: false, message: "Error updating the project" },
      { status: 500 }
    );
  }
}
