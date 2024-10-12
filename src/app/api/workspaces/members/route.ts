import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/dbConnect';
import { Member, workspaceModel } from '@/model/Model';
import mongoose from 'mongoose';

export async function GET(req: Request) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const workspaceId = searchParams.get('workspaceId');
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    if (!status) {
      return NextResponse.json(
        { success: false, message: 'Status is missing' },
        { status: 400 }
      );
    }

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, message: 'Workspace ID is missing' },
        { status: 400 }
      );
    }

    const getMembersByStatus = await workspaceModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(workspaceId),
        },
      },
      {
        $unwind: {
          path: '$members',
        },
      },
      {
        $match: {
          'members.status': status,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'members.userId',
          foreignField: 'userId',
          as: 'userDetails',
          pipeline: [
            {
              $project: {
                _id: 1,
                userId: 1,
                email: 1,
                avatar: 1,
                firstName: 1,
                lastName: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$userDetails',
        },
      },
      {
        $project: {
          _id: 1,
          userId: '$userDetails.userId',
          email: '$userDetails.email',
          avatar: '$userDetails.avatar',
          status: '$members.status',
          firstName: '$members.firstName',
          lastName: '$Members.lastName',
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: getMembersByStatus,
      message: 'Members fetched successfully',
    });
  } catch (error: any) {
    console.error('Error in fetching members by status:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId');
  const memberId = searchParams.get('memberId');

  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!memberId) {
      return NextResponse.json(
        { success: false, message: 'Member ID is missing' },
        { status: 400 }
      );
    }

    const workspace = await workspaceModel.findById(workspaceId);
    if (!workspace) {
      return NextResponse.json(
        { success: false, message: 'Workspace not found' },
        { status: 404 }
      );
    }

    const user = workspace.members.find(
      (member: Member) => member.userId === userId
    );

    if (
      !user ||
      (user.role !== 'admin' &&
        userId.toString() !== workspace.owner.toString())
    ) {
      return NextResponse.json(
        { success: false, message: 'You are not authorized to remove members' },
        { status: 403 }
      );
    }

    const updatedWorkspace = await workspaceModel.findOneAndUpdate(
      { _id: workspaceId },
      { $pull: { members: { userId: memberId } } },
      { new: true }
    );

    if (!updatedWorkspace) {
      return NextResponse.json(
        { success: false, message: 'Failed to remove member' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedWorkspace,
      message: 'Member removed successfully',
    });
  } catch (error: any) {
    console.error('Error in removing member from workspace:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
