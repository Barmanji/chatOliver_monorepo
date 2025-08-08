import fs from "fs";
import type { Request } from "express";

/**
 * Utility types for pagination options (avoids relying on external plugin typings)
 */
type PaginationCustomLabels = Record<string, string>;

interface MongoosePaginateLikeOptions {
  page: number;
  limit: number;
  pagination: boolean;
  customLabels: { pagingCounter: string } & PaginationCustomLabels;
}

// Multer typing helpers
interface MulterFileLike { path: string }
type RequestWithMulter = Request & {
  file?: MulterFileLike;
  files?: MulterFileLike[] | { [fieldname: string]: MulterFileLike[] };
};

/**
 *
 * @param {string[]} fieldsArray
 * @param {any[]} objectArray
 * @returns {any[]}
 * @description utility function to only include fields present in the fieldsArray
 * For example,
 * ```js
 * let fieldsArray = [
 * {
 * id:1,
 * name:"John Doe",
 * email:"john@doe.com"
 * phone: "123456"
 * },
 * {
 * id:2,
 * name:"Mark H",
 * email:"mark@h.com"
 * phone: "563526"
 * }
 * ]
 * let fieldsArray = ["name", "email"]
 *
 * const filteredKeysObject = filterObjectKeys(fieldsArray, fieldsArray)
 * console.log(filteredKeysObject)
 *
 * //  Above line's output will be:
 * //  [
 * //      {
 * //        name:"John Doe",
 * //        email:"john@doe.com"
 * //      },
 * //      {
 * //        name:"Mark H",
 * //        email:"mark@h.com"
 * //      }
 * //  ]
 *
 * ```
 */
export const filterObjectKeys = <T extends Record<string, unknown>>(
  fieldsArray: string[],
  objectArray: T[]
): T[] => {
  const filteredArray = structuredClone(objectArray).map((originalObj) => {
    const obj: Partial<T> = {};
    structuredClone(fieldsArray)?.forEach((field) => {
      const key = String(field).trim();
      if (key in originalObj) {
        (obj as Record<string, unknown>)[key] = (originalObj as Record<string, unknown>)[key];
      }
    });
    if (Object.keys(obj).length > 0) return obj as T;
    return originalObj;
  });
  return filteredArray;
};

/**
 *
 * @param {any[]} dataArray
 * @param {number} page
 * @param {number} limit
 * @returns {{previousPage: string | null, currentPage: string, nextPage: string | null, data: any[]}}
 */
export const getPaginatedPayload = <T>(
  dataArray: T[],
  page: number,
  limit: number
): {
  page: number;
  limit: number;
  totalPages: number;
  previousPage: boolean;
  nextPage: boolean;
  totalItems: number;
  currentPageItems: number;
  data: T[];
} => {
  const startPosition = +(page - 1) * limit;

  const totalItems = dataArray.length; // total documents present after applying search query
  const totalPages = Math.ceil(totalItems / limit);

  const sliced = structuredClone(dataArray).slice(
    startPosition,
    startPosition + limit
  );

  const payload = {
    page,
    limit,
    totalPages,
    previousPage: page > 1,
    nextPage: page < totalPages,
    totalItems,
    currentPageItems: sliced?.length,
    data: sliced,
  };
  return payload;
};

/**
 *
 * @param req
 * @param {string} fileName
 * @description returns the file's static path from where the server is serving the static image
 */
export const getStaticFilePath = (req: Request, fileName: string): string => {
  return `${req.protocol}://${req.get("host")}/images/${fileName}`;
};

/**
 *
 * @param {string} fileName
 * @description returns the file's local path in the file system to assist future removal
 */
export const getLocalPath = (fileName: string): string => {
  return `public/images/${fileName}`;
};

/**
 *
 * @param {string} localPath
 * @description Removed the local file from the local file system based on the file path
 */
export const removeLocalFile = (localPath: string): void => {
  fs.unlink(localPath, (err) => {
    if (err) console.error("Error while removing local files: ", err);
    else {
      console.info("Removed local: ", localPath);
    }
  });
};

/**
 * @param {import("express").Request} req
 * @description **This utility function is responsible for removing unused image files due to the api fail**.
 *
 * **For example:**
 * * This can occur when product is created.
 * * In product creation process the images are getting uploaded before product gets created.
 * * Once images are uploaded and if there is an error creating a product, the uploaded images are unused.
 * * In such case, this function will remove those unused images.
 */
export const removeUnusedMulterImageFilesOnError = (req: Request): void => {
  try {
    const { file: multerFile, files: multerFiles } = req as RequestWithMulter;

    if (multerFile) {
      // If there is file uploaded and there is validation error
      // We want to remove that file
      removeLocalFile(multerFile.path);
    }

    if (multerFiles) {
      /** If there are multiple files uploaded for more than one fields */
      const filesValueArray = Array.isArray(multerFiles)
        ? [multerFiles]
        : (Object.values(multerFiles) as MulterFileLike[][]);

      filesValueArray.forEach((fileFields) => {
        (fileFields as MulterFileLike[]).forEach((fileObject) => {
          removeLocalFile(fileObject.path);
        });
      });
    }
  } catch (error) {
    // fail silently
    console.error("Error while removing image files: ", error);
  }
};

/**
 *
 * @param options
 * @returns pagination options compatible with mongoose paginate plugins
 */
export const getMongoosePaginationOptions = ({
  page = 1,
  limit = 10,
  customLabels,
}: {
  page?: number;
  limit?: number;
  customLabels?: PaginationCustomLabels;
}): MongoosePaginateLikeOptions => {
  return {
    page: Math.max(page, 1),
    limit: Math.max(limit, 1),
    pagination: true,
    customLabels: {
      pagingCounter: "serialNumberStartFrom",
      ...(customLabels ?? {}),
    },
  };
};

/**
 * @param {number} max Ceil threshold (exclusive)
 */
export const getRandomNumber = (max: number): number => {
  return Math.floor(Math.random() * max);
};

