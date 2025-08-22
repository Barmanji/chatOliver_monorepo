import fs from "fs";
import type { Request } from "express";

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

export const getStaticFilePath = (req: Request, fileName: string): string => {
  return `${req.protocol}://${req.get("host")}/images/${fileName}`;
};

export const getLocalPath = (fileName: string): string => {
  return `public/images/${fileName}`;
};

export const removeLocalFile = (localPath: string): void => {
  fs.unlink(localPath, (err) => {
    if (err) console.error("Error while removing local files: ", err);
    else {
      console.info("Removed local: ", localPath);
    }
  });
};

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

