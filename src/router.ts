import type {RequestHandler, Request} from "./request";
import {NotFoundError} from "./exception";
import type {Response} from "./response";

export type route = [route: string, handler: RequestHandler];

export class RegexMatch implements RequestHandler {
    constructor(private readonly routes: route[]) {
    }

    async handle(request: Request): Promise<Response> {
        let previousRegex = request.attribute('_previousRegex', '^');

        for (const [route, routeHandler] of this.routes) {
            const routeMatches = (request.url.pathname ?? '/').match(new RegExp(`${previousRegex}${route}`));
            if (!routeMatches) {
                continue;
            }

            let attributes: {[name: string]: string} = routeMatches.groups ?? {};
            attributes['_previousRegex'] = `${previousRegex}${route}`;
            request.setAttributes(attributes);

            return await routeHandler.handle(request);
        }

        throw new NotFoundError();
    }
}