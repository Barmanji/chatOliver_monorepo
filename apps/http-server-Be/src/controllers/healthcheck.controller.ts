import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Request, RequestHandler, Response } from "express"



const healthcheck: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    res.status(200)
    .json(new ApiResponse(200, {}, "Server is up and running"))
})

export {
    healthcheck
    }


