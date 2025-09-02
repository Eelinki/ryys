import type {Middleware, Request, RequestHandler} from "./request";
import {Response} from "./response";
import * as cookie from 'cookie';

export class CookieParser implements Middleware {
    next: RequestHandler;

    constructor(next: RequestHandler) {
        this.next = next;
    }

    async handle(request: Request): Promise<Response> {
        const cookieHeader = request.rawMessage.headers.cookie;
        if (cookieHeader && request.cookies === null) {
            request.cookies = cookie.parse(cookieHeader);
        }

        return await this.next.handle(request);
    }
}