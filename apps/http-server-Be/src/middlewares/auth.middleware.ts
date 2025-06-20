import dotenv from "dotenv";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User, IUser } from "../models/user/user.model";
import { Request, Response, NextFunction, RequestHandler } from "express";

dotenv.config({ path: "./.env"})
// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}

interface CustomJwtPayload extends JwtPayload {
    _id: string;
}
export const verifyJWT: RequestHandler = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");
        //aliased as req.get (req.header(field))
        // console.log(token);
        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET as string,
        ) as CustomJwtPayload;

        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken",
        );

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user = user;
        next();
    } catch (error: any) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});
