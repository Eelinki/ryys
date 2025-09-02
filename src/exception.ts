import type {Middleware, Request, RequestHandler} from "./request";
import {Response} from "./response";

export interface PublicError extends Error {
    code: number;
}

export class PublicError extends Error implements PublicError {
    code: number;

    constructor(code: number, message?: string) {
        super(message);
        this.name = 'PublicError';
        this.code = code;
    }
}

export class NotFoundError extends PublicError {
    constructor(message?: string) {
        super(404, message);
        this.name = 'NotFoundError';
    }
}

export class ErrorHandler implements Middleware {
    next: RequestHandler;

    constructor(next: RequestHandler) {
        this.next = next;
    }

    async handle(request: Request): Promise<Response> {
        try {
            return await this.next.handle(request);
        } catch (error: unknown) {
            if (error instanceof PublicError) {
                return new Response(error.code).text([error.name, error.message].filter(Boolean).join(': '));
            }

            console.error('Unhandled error in request handler:', error);

            return new Response(500);
        }
    }
}