import dbConnect from '@/lib/dbConnect';
import { workspaceModel } from '@/model/Model';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const inviteCode = searchParams.get('invitecode');
    const { userId } = auth();
    if (!userId) {
      return Response.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    if (!inviteCode) {
      return Response.json(
        { success: false, message: 'inviteCode is missing' },
        { status: 400 }
      );
    }
    const workspace = await workspaceModel.findOne({ inviteCode });
    if (!workspace) {
      return Response.json(
        { success: false, message: 'Invalid invite code' },
        { status: 400 }
      );
    }

    if (workspace.members.includes(userId)) {
      return Response.json(
        {
          success: false,
          message: 'You are already a member of this workspace',
        },
        { status: 400 }
      );
    }

    if (workspace.inviteCodeExpiry < new Date()) {
      return Response.json(
        { success: false, message: 'Invite code has expired' },
        { status: 400 }
      );
    }
    const addPersonToWorkspace = await workspaceModel.findOneAndUpdate(
      { _id: workspace._id, 'members.userId': userId },
      { $set: { 'members.$.status': 'active' } },
      { new: true }
    );
    return Response.json(
      {
        success: true,
        addPersonToWorkspace,
        message: 'You have been added to the workspace',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('error in workspace invite accept route', error);
    return Response.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
