import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const chatSchema = new Schema(
    {
        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        isGroupChat: {
            type: Boolean,
            default: false,
        },
        groupId: {
            type: Schema.Types.ObjectId,
            ref: "Group",
            default: null,
        },
        typingUsers: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    {
        timestamps: true,
    }
);

chatSchema.plugin(mongooseAggregatePaginate);

export const Chat = mongoose.model("Chat", chatSchema);
