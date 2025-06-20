import { Request, Response, NextFunction, RequestHandler } from 'express';

const asyncHandler = (requestHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch(next);
    };
};

export { asyncHandler };
//
// const asyncHandler = (requestHandler: any) => {
//     return (req, res, next) => {
//         Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
//     }
// }
//
// export { asyncHandler }
//
