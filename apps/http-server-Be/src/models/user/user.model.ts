import jwt from "jsonwebtoken";
import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new Schema(
    {
        friends: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true, //whenever we need to search somsethiing its best adviced to enable the index tag in schema!!
        },
        fullname: {
            type: String,
            required: true,
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
            required: [true, "Password is required"], //with all true field we can pass in arry for default values
        },

        profilePicture: {
            type: String, //cloudnary something something like AWS for url ()FREEE() read about it!
            required: true,
        },
        bio: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ["online", "offline"],
            default: "offline",
        },
        refreshToken: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

//dont write callback like() => {} in .pre because we dont have .this fucnatiolity. READ MORE ABOUT!!! ###a
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    const Password = await bcrypt.compare(password, this.password);
    return Password;
};

userSchema.methods.generateAccessToken = function () {
    // jwt.verify(token, secretOrPublicKey, [options, callback]) or jwt.sign(payload, secretOrPrivateKey, [options, callback]) and 1h 1d you can pass liek htat
    return jwt.sign(
        {
            // These data will be encoded by JWT
            _id: this._id,
            username: this.username,
            email: this.email,
            fullname: this.fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};
userSchema.methods.generateRefreshToken = function () {
    // stance methods Instances of Models are documents. Documents have many of their own built-in instance methods. We may also define our own custom document instance methods.
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

export const User = mongoose.model("User", userSchema);
