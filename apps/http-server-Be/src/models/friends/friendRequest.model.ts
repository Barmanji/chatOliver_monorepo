import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const friendRequestSchema = new Schema(
    {
        from: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        to: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending", // optional tbh
        },
    },
    {
        timestamps: true,
    }
);

friendRequestSchema.plugin(mongooseAggregatePaginate);

export const FriendRequest = mongoose.model(
    "FriendRequest",
    friendRequestSchema
);
