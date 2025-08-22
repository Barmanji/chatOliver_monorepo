import dotenv from "dotenv";
import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config({ path: "./.env"})
// ---------------------------
// 1. User Data Interface
// ---------------------------
export interface IUser {
    username: string;
    password: string;
    email: string;
    avatar: string;
    bio: string;
    status: "online" | "offline";
    refreshToken: string;
    friends?: mongoose.Types.ObjectId[];
    _id?: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

// ---------------------------
// 2. User Methods Interface
// ---------------------------
export interface IUserMethods {
    save?: any;
    isPasswordCorrect(password: string): Promise<boolean>;
    generateAccessToken(): string;
    generateRefreshToken(): string;
}

// ---------------------------
// 3. User Schema Definition
// ---------------------------
const userSchema = new Schema<IUser, Model<IUser, {}, IUserMethods>, {}, IUserMethods>(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        avatar: {
            type: String,
            required: true,
        },
        refreshToken: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

// ---------------------------
// 4. Pre-save Hook for Password Hashing
// ---------------------------
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// ---------------------------
// 5. Instance Methods
// ---------------------------
userSchema.methods.isPasswordCorrect = async function (password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function (): string {
    return jwt.sign(
        {
            _id: this._id,
            username: this.username,
            email: this.email,
        },
        process.env.ACCESS_TOKEN_SECRET as any,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY as any,
        }
    );
};

userSchema.methods.generateRefreshToken = function (): string {
    return jwt.sign(
        { _id: this._id },
        process.env.REFRESH_TOKEN_SECRET as any,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY as any,
        }
    );
};

// ---------------------------
// 6. Export Model
// ---------------------------
export const User = mongoose.model<IUser, Model<IUser, {}, IUserMethods>>("User", userSchema);
