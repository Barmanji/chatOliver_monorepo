import dotenv from "dotenv";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { IUser, IUserMethods, User } from "../models/user/user.model";
import {
    uploadResultCloudinary,
    deleteFromCloudinary,
} from "../utils/fileUploaderCloudinary";
import { ApiResponse } from "../utils/ApiResponse";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";
import { Request, Response, NextFunction, RequestHandler } from "express";

dotenv.config({ path: "./env" });

type MulterRequest = Request & {
    files?: {
        [fieldname: string]: Express.Multer.File[];
    };
}

interface TokenPayload extends JwtPayload {
    _id: string;
}

const generateAccessAndRefreshTokens = async (userId: Types.ObjectId) => {
    try {
        const user = (await User.findById(userId)) as IUser & IUserMethods;
        const accessToken = user?.generateAccessToken();
        const refreshToken = user?.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating refresh and access token",
        );
    }
};

const registerUser: RequestHandler = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const multerReq = req as MulterRequest;
    const { username, email, fullname, password } = multerReq.body;
    if (
        [username, email, fullname, password].some(
            (field) => field?.trim() === "",
        )
    ) {
        throw new ApiError(
            400,
            "All fields are compulsory - username, email, fullname, password",
        );
    }
    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });
    if (existedUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    if (!multerReq.files?.profilePicture?.[0]?.path) {
        throw new ApiError(400, "Profile picture file is required");
    }

    const profilePictureLocalPath = multerReq.files.profilePicture[0].path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path; //[0] is for first property
    if (!profilePictureLocalPath) {
        throw new ApiError(
            400,
            "Profile image isn't uploaded properly locally",
        );
    }

    const profilePictureUploadedOnClodinary = await uploadResultCloudinary(
        profilePictureLocalPath,
    );
    if (!profilePictureUploadedOnClodinary) {
        throw new ApiError(
            400,
            "Profile image isn't uploaded properly on cloudinary",
        );
    }

    //console.log("req.files: ",req.files)
    const user = await User.create({
        fullname,
        profilePicture: profilePictureUploadedOnClodinary.url,
        email,
        password,
        username: username.toLowerCase().trim(), // well i have alaready trimmed it
    });
    const createdUserInMongoDB = await User.findById(user._id).select(
        "-password -refreshToken",
    ); //- sign means discard it " " means
    if (!createdUserInMongoDB)
        throw new ApiError(
            500,
            "Error with registering user in MongoDB, please try again",
        );

    return res
        .status(201)
        .json(
            new ApiResponse(
                200,
                createdUserInMongoDB,
                "User Registered succesfully",
            ),
        );
});

const loginUser: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { username, email, password } = req.body;
    if (!username && !email) {
        throw new ApiError(
            400,
            "Atleast one of the field is required -> Email or Username",
        );
    }
    //User.findOne({email}) --> this is valid as wellfor email only or for username just change it to username
    const findUser: any = await User.findOne({
        $or: [{ email }, { username }], //better syntax
    });
    if (!findUser) {
        throw new ApiError(
            404,
            "This user doesn't exist with this email or username",
        );
    }
    const passwordValidity = await findUser.isPasswordCorrect(password);
    if (!passwordValidity) {
        throw new ApiError(401, "Invalid user credentials");
    }
    const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(
        findUser._id,
    );
    const loggedInUser = await User.findById(findUser._id).select(
        "-password -refreshToken",
    ); //little optional
    const option = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken", refreshToken, option)
        .json(
            new ApiResponse(
                200,
                {
                    findUser: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User logged in succesfully",
            ),
        );
});

const logoutUser: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    await User.findByIdAndUpdate(
        req.user!._id,
        {
            $unset: { refreshToken: 1 }, //this removes the field of the doc
        },
        {
            new: true,
        },
    );

    const option = {
        httpOnly: true,
        secure: true, // to use only in HTTPS addresses
    };

    return res
        .status(200)
        .clearCookie("accessToken", option) //method by cookieparser to clear
        .clearCookie("refreshToken", option)
        .json(new ApiResponse(200, {}, "User Logged Out"));
});

const refreshAccessToken: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken; //.cookies for pc, .body for mobiles

    if (!incomingRefreshToken) {
        throw new ApiError(404, "Unauthorized request");
    }
    //now refresh the incoming ref.
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET as string,
        ) as TokenPayload;
        const user = await User.findById(decodedToken._id);

        if (!user) {
            throw new ApiError(400, "Fictitious Token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }
        const options = {
            httpOnly: true,
            secure: true,
        };
        const { accessToken: accessToken, refreshToken: refreshToken } = await generateAccessAndRefreshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: refreshToken,
                    },
                    "access token refreshed",
                ),
            );
    } catch (error: any) {
        throw new ApiError(401, error?.message || "invalid refresh token");
    }
});

//-------------- CHANGE PASS --------------------/
const changeCurrentPassword: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user!.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Old password is incorrect");
    }

    user!.password = newPassword;
    await user!.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "Current user fetched successfully"),
        );
});

const updateAccountDetails: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { username, fullname, email } = req.body;
    if (!fullname || !username || !email) {
        throw new ApiError(400, "All fields are necessary");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname: fullname, //only fullname can be enf due to ES6 , READ about ES6
                email: email,
            },
        },
        { new: true },
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details added succesfully"));
});

const updateUserProfilePicture: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const multerReq = req as MulterRequest;
    const profilePictureLocalPath = multerReq.file?.path;

    if (!profilePictureLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    const oldProfilePicture = req.user?.profilePicture;
    oldProfilePicture && (await deleteFromCloudinary(oldProfilePicture)); //not understood
    const newProfilePictureUploadedOnClodinary = await uploadResultCloudinary(
        profilePictureLocalPath,
    );

    if (!newProfilePictureUploadedOnClodinary!.url) {
        throw new ApiError(400, "Error while uploading profile picture");
    }
    const profilePicuteUpdationOnMongoDB = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                profilePicture: newProfilePictureUploadedOnClodinary!.url,
            },
        },
        { new: true },
    ).select("-password");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                profilePicuteUpdationOnMongoDB,
                "Profile updated successfully",
            ),
        ); //avatar.url is unnecrary and has been put by none other than BARMANJI
});

const updateUserBio: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { bio } = req.body;

    if (typeof bio !== "string" || !bio.trim()) {
        throw new ApiError(400, "Invalid bio");
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user!._id,
        { $set: { bio: bio.trim() } },
        { new: true }, // returns the updated document rather than the original
    ).select("-password"); // returns the user without the password field

    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "Bio updated successfully"));
});

const getMyFriendsList: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user!.friends, "Friend list fetched"));
});

const getAnyUserFriendList: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { username } = req.params;
    if (!username) {
        throw new ApiError(400, "Username is required");
    }
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    const userFriend = user.friends;
    return res
        .status(200)
        .json(new ApiResponse(200, userFriend, "Friend list fetched"));
});

const getUserProfile: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { username } = req.params;
    if (!username) {
        throw new ApiError(400, "Username is required");
    }
    const user = await User.findOne({
        username: username.toLowerCase(),
    }).select("-__v -password -refreshToken");
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    return res.status(200).json(new ApiResponse(200, user, "user fetched"));
});

export {
    generateAccessAndRefreshTokens,
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserProfilePicture,
    updateUserBio,
    getUserProfile,
    getMyFriendsList,
    getAnyUserFriendList,
};
