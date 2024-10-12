import { resend } from '@/helpers/resend';
import dbConnect from '@/lib/dbConnect';
import { workspaceModel } from '@/model/Model';
import { auth } from '@clerk/nextjs/server';
import { nanoid } from 'nanoid';
import WorkspaceInviteEmail from '../../../../../emails/WorkspaceInviteEmail';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  await dbConnect();
  const { emails, role } = await req.json();
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId');
  try {
    const { userId } = auth();

    if (!userId) {
      return Response.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!emails) {
      return Response.json(
        { success: false, message: 'Emails are missing' },
        { status: 400 }
      );
    }
    if (!workspaceId) {
      return Response.json(
        { success: false, message: 'Workspace ID is missing' },
        { status: 400 }
      );
    }

    const workSpace = await workspaceModel.findById(workspaceId);

    if (!workSpace) {
      return Response.json(
        { success: false, message: "Workspace doesn't exist" },
        { status: 404 }
      );
    }

    if (workSpace.isInviteActive === false) {
      return Response.json(
        { success: false, message: 'Invitation is not active' },
        { status: 403 }
      );
    }

    const inviteCode = nanoid(25);
    const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/join?invite_code=${inviteCode}`;

    try {
      const sendWorkspaceInviteEmail = await resend.emails.send({
        from: 'Todolist <support@clikit.live>',
        to: emails,
        subject: 'Workspace Invitation',
        react: WorkspaceInviteEmail({
          inviteUrl: inviteUrl,
          workspaceName: workSpace.name,
        }),
      });

      if (!sendWorkspaceInviteEmail.error) {
        workSpace.inviteCode = inviteCode;
        workSpace.inviteCodeExpiry = Date.now() + 3600000;
        workSpace.members.push({
          userId,
          role,
          status: 'pending',
        });
        await workSpace.save();

        return Response.json(
          { success: true, message: 'Invitation sent successfully' },
          { status: 200 }
        );
      }
    } catch (emailError) {
      console.error(emailError);
      console.error('Error sending email:', emailError);
      return Response.json(
        { success: false, message: 'Error sending invitation' },
        { status: 500 }
      );
    }
    return Response.json(
      { success: true, message: 'please check your email for invitation link' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error occurred during workspace invitation process:', error);
    return Response.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
