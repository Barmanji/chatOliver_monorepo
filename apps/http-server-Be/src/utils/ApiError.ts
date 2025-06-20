class ApiError<T = any> extends Error {
    statusCode: number;
    data: T | null;
    success: boolean;
    errors: Error[];

    constructor(
        statusCode: number,
        message = "Something went wrong",
        errors: Error[] = [],
        stack?: string,
    ) {
        super(message);

        this.statusCode = statusCode;
        this.data = null;
        this.success = false;
        this.errors = errors;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }

        this.name = this.constructor.name;
    }
}

export { ApiError };
