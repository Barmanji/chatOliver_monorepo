import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const callLogSchema = new Schema(
    {
        caller: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiver: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        callType: {
            type: String,
            enum: ["audio", "video"],
            required: true,
        },
        status: {
            type: String,
            enum: ["missed", "answered"],
            required: true,
        },
    },
    {
        timestamps: { createdAt: "timestamp", updatedAt: false }, // logs only need timestamp
    }
);

callLogSchema.plugin(mongooseAggregatePaginate);

export const CallLog = mongoose.model("CallLog", callLogSchema);
