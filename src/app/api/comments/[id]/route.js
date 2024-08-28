import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import { taskModel, commentModel } from "@/model/Model";
import { getMongoosePaginationOptions } from "@/helpers/pagination";

export async function POST(request, { params }) {
  const { id } = params;
  await dbConnect();
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json(
        { success: false, messppage: "unauthorized" },
        { status: 401 }
      );
    }
    const { content } = await request.json();
    if (!content) {
      return Response.json(
        { success: false, message: "comment is missing" },
        { status: 400 }
      );
    }

    const task = await taskModel.findById(id);
    if (!task) {
      return Response.json(
        { success: false, message: "task not found" },
        { status: 404 }
      );
    }

    const comment = new commentModel({
      content,
      owner: userId,
      task: id,
    });

    await comment.save();

    return Response.json({ success: true, data: comment }, { status: 201 });
  } catch (error) {
    return Response.json(
      { success: false, message: `error creating comment ${error}` },
      { status: 404 }
    );
  }
}

export async function PUT(request, { params }) {
  const { id } = params;
  await dbConnect();
  console.log(id);
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json(
        { success: false, message: "unauthorized" },
        { status: 401 }
      );
    }
    const { content } = await request.json();
    const comment = await commentModel.findOneAndUpdate(
      { _id: id, owner: userId },
      { content },
      { new: true }
    );

    return Response.json({ success: true, data: comment }, { status: 200 });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message },
      { status: 401 }
    );
  }
}

export async function DELETE(_, { params }) {
  const { id } = params;
  await dbConnect();
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json(
        { success: false, message: "unauthorized" },
        { status: 401 }
      );
    }
    const comment = await commentModel.findOneAndDelete({
      _id: id,
      owner: userId,
    });

    return Response.json({ success: true, data: comment }, { status: 200 });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message },
      { status: 401 }
    );
  }
}

export async function GET(request, { params }) {
  await dbConnect();
  const { id } = params;
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json(
        { success: false, message: "unauthorized" },
        { status: 401 }
      );
    }
    console.log(typeof id);
    const allCommentsAggregate = commentModel.aggregate([
      {
        $match: {
          task: new mongoose.Types.ObjectId(id),
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
          task: 1,
          content: 1,
          files: 1,
          ownerDetails: { $first: "$ownerDetails" },
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    if (!allCommentsAggregate) {
      return Response.json(
        { success: false, message: "No comments found" },
        { status: 404 }
      );
    }

    const allComments = await commentModel.aggregatePaginate(
      allCommentsAggregate,
      getMongoosePaginationOptions({
        page: 1,
        limit: 20,
        customLabels: {
          totalDocs: "commentsCount",
          docs: "allComments",
        },
      })
    );

    return Response.json(
      {
        success: true,
        allComments,
        message: "comments fetched successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { success: false, message: "error fetching comments", error },
      { status: 404 }
    );
  }
}
