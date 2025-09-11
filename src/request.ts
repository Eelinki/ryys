import * as http from "node:http";
import type {Response} from "./response";
import {URLSearchParams} from "node:url";
import {FormDataParser, JsonParser, File} from "./bodyparser";
import type {BodyParserOptions} from "./ryys";

export interface RequestHandler {
    handle(request: Request): Promise<Response>;
}

export interface Middleware extends RequestHandler { }

export class Request {
    public rawMessage: http.IncomingMessage;
    public url: URL;
    private _attributes: {[name: string]: string;};
    private _cookies: Record<string, string | undefined> | null;
    private readonly _store: Map<string, any>;
    public bodyParserOptions: Required<BodyParserOptions>;

    constructor(req: http.IncomingMessage, bodyParserOptions: Required<BodyParserOptions>) {
        this.rawMessage = req;
        this._attributes = {};
        const url = URL.parse(`http://${process.env.HOST ?? 'localhost'}${req.url}`);
        if (!url) {
            throw new Error('Could not parse URL from request');
        }
        this.url = url;
        this._cookies = null;
        this._store = new Map();
        this.bodyParserOptions = bodyParserOptions;
    }

    setAttributes(attributes: {[name: string]: string}): void {
        this._attributes = attributes;
    }

    attribute(name: string, defaultValue: string = ''): string {
        return this._attributes[name] ?? defaultValue;
    }

    attributes(): {[name: string]: string;} {
        return Object.fromEntries(
            Object.entries(this._attributes).filter(attr => !attr[0].startsWith('_'))
        );
    }

    queryParams(): URLSearchParams {
        return this.url.searchParams;
    }

    queryParam(name: string, defaultValue: string = ''): string {
        return this.url.searchParams.get(name) ?? defaultValue;
    }

    setCookies(cookies: Record<string, string | undefined>) {
        this._cookies = cookies;
    }

    cookies(): Record<string, string | undefined> | null {
        return this._cookies;
    }

    cookie(name: string, defaultValue: string = ''): string {
        if (!this._cookies) {
            throw new Error('Tried to access cookies before parsing them');
        }
        return this._cookies[name] ?? defaultValue;
    }

    async json(): Promise<Object> {
        return await new JsonParser(this.bodyParserOptions).parse(this);
    }

    async multipart(): Promise<{formData: FormData, files: File[]}> {
        return await new FormDataParser(this.bodyParserOptions).parse(this);
    }

    store(): Map<string, any> {
        return this._store;
    }
}