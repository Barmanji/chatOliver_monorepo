import { body, param } from "express-validator";
export const mongoIdPathVariableValidator = (idName: any) => {
  return [
    param(idName).notEmpty().isMongoId().withMessage(`Invalid ${idName}`),
  ];
};
export const mongoIdRequestBodyValidator = (idName: any) => {
  return [body(idName).notEmpty().isMongoId().withMessage(`Invalid ${idName}`)];
};

