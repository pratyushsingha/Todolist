import mongoose, { Schema, Document } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

export interface User extends Document {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
}

export interface Task extends Document {
  title: string;
  description?: string;
  labels: Schema.Types.ObjectId[];
  dueDate?: Date;
  priority?: "priority1" | "priority2" | "priority3" | "priority4";
  reminders: Array<{
    reminderDate: Date;
    reminderTime: string;
  }>;
  isCompleted: boolean;
  taskId?: Schema.Types.ObjectId;
  project: Schema.Types.ObjectId;
  owner: string;
  section: Schema.Types.ObjectId;
}

export interface Project extends Document {
  projectName: string;
  color?: string;
  workspace: Schema.Types.ObjectId;
  isFavourite: boolean;
  owner: string;
}

export interface Section extends Document {
  name: string;
  project: Schema.Types.ObjectId;
  owner: string;
}

export interface Comment extends Document {
  content: string;
  files?: string;
  task: Schema.Types.ObjectId;
  owner: string;
}

export interface Workspace extends Document {
  name: string;
  owner: string;
  members: string[];
  isTeam: boolean;
}

export interface Label extends Document {
  name: string;
  color: string;
  owner: string;
}


const userSchema: Schema<User> = new Schema(
  {
    userId: {
      type: String,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    avatar: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const taskSchema: Schema<Task> = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    labels: [
      {
        type: Schema.Types.ObjectId,
        ref: "Label",
      },
    ],
    dueDate: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ["priority1", "priority2", "priority3", "priority4"],
    },
    reminders: [
      {
        reminderDate: {
          type: Date,
        },
        reminderTime: {
          type: String,
        },
      },
    ],
    isCompleted: {
      type: Boolean,
      default: false,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
    },
    owner: {
      type: String,
      required: true,
    },
    section: {
      type: Schema.Types.ObjectId,
      ref: "Section",
    },
  },
  { timestamps: true }
);

const projectSchema: Schema<Project> = new Schema(
  {
    projectName: {
      type: String,
      required: true,
    },
    color: {
      type: String,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
    },
    isFavourite: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const workspaceSchema: Schema<Workspace> = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    owner: {
      type: String,
      required: true,
    },
    members: [String],
    isTeam: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const commentSchema: Schema<Comment> = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    files: {
      type: String,
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
    },
    owner: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const sectionSchema: Schema<Section> = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
    },
    owner: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const labelSchema: Schema<Label> = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    owner: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

taskSchema.plugin(mongooseAggregatePaginate);
commentSchema.plugin(mongooseAggregatePaginate);


const userModel = mongoose.models.User || mongoose.model<User>("User", userSchema);
const taskModel = mongoose.models.Task || mongoose.model<Task>("Task", taskSchema);
const projectModel = mongoose.models.Project || mongoose.model<Project>("Project", projectSchema);
const sectionModel = mongoose.models.Section || mongoose.model<Section>("Section", sectionSchema);
const commentModel = mongoose.models.Comment || mongoose.model<Comment>("Comment", commentSchema);
const workspaceModel = mongoose.models.Workspace || mongoose.model<Workspace>("Workspace", workspaceSchema);
const labelModel = mongoose.models.Label || mongoose.model<Label>("Label", labelSchema);

export {
  userModel,
  taskModel,
  projectModel,
  sectionModel,
  commentModel,
  workspaceModel,
  labelModel,
};
