import { Webhook } from "svix";
import { headers } from "next/headers";
import dbConnect from "@/lib/dbConnect";
import { projectModel, userModel, workspaceModel } from "@/model/Model";
import { WebhookEvent } from "@clerk/nextjs/server";

async function handler(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local"
    );
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return Response.json(
      { success: false, message: "Error verifying webhook" },
      {
        status: 400,
      }
    );
  }
  const eventType = evt.type;
  if (eventType === "user.created" || eventType === "user.updated") {
    const data = evt.data;
    console.log(data.id);

    await dbConnect();
    const user = await userModel.findOne({ userId: data.id });
    if (!user) {
      const newUser = new userModel({
        userId: data.id,
        email: data.email_addresses[0].email_address,
        firstName: data.first_name,
        lastName: data.last_name,
        avatar: data.image_url,
      });

      const defaultWorkSpace = new workspaceModel({
        name: "My Projects",
        owner: data.id,
        members: [data.id],
      });

      await newUser.save();
      await defaultWorkSpace.save();

      const defaultProject = new projectModel({
        projectName: "Home 🏡",
        color: "#FFD700",
        workspace: defaultWorkSpace._id,
        owner: data.id,
      });
      await defaultProject.save();
    } else {
      await userModel.updateOne(
        { userId: data.id },
        {
          // email: data.data.email_addresses[0].email_address,
          email: data.email_addresses[0].email_address,
          firstName: data.first_name,
          lastName: data.last_name,
          avatar: data.image_url,
        }
      );
    }
  }
  return Response.json(
    { success: true, message: "user pushed to db" },
    { status: 200 }
  );
}

export { handler as GET, handler as POST, handler as PUT };
