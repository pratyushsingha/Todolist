import dbConnect from "@/lib/dbConnect";
import { sectionModel, taskModel } from "@/model/Model";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
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
    const { name } = await request.json();
    if (!name) {
      return Response.json(
        { success: false, message: "name is missing" },
        { status: 400 }
      );
    }
    const createdSection = new sectionModel({
      name,
      project: projectId,
      owner: userId,
    });
    await createdSection.save();
    return Response.json(
      { success: true, data: createdSection },
      { status: 201 }
    );
  } catch (error) {
    console.log("error creating section", error);
    return Response.json(
      { success: false, message: "error creating section" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
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
    const section = await sectionModel.findById(projectId);
    if (!section) {
      return Response.json(
        { success: false, message: "Section not found" },
        { status: 404 }
      );
    }
    const { name } = await request.json();
    if (!name) {
      return Response.json(
        { success: false, message: "name is missing" },
        { status: 400 }
      );
    }
    if (section.owner.toString() !== userId) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    section.name = name;
    await section.save();
    return Response.json(
      { success: true, data: section, message: "section updated successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.log("error creating section", error);
    return Response.json(
      { success: false, message: "error creating section" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
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
    const section = await sectionModel.findById(projectId);
    if (section.owner.toString() !== userId) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const tasksUnderSection = await taskModel.find({ section });
    console.log(tasksUnderSection);
    return Response.json(
      { success: true, message: "section deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.log("error deleting section", error);
    return Response.json(
      { success: false, message: "error deleting section" },
      { status: 500 }
    );
  }
}
