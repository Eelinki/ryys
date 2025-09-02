import {type OutgoingHttpHeaders} from "node:http";
import {Readable} from "node:stream";
import {type PathLike} from "node:fs";
import {
    type Emitter,
    AttachmentEmitter,
    EmptyEmitter,
    HtmlEmitter,
    JsonEmitter,
    StreamingEmitter,
    TextEmitter
} from "./emitter";

export class Response {
    private _emitter: Emitter;
    public code: number;
    public body?: string | Object;
    public headers: OutgoingHttpHeaders;

    constructor(code: number = 200) {
        this.code = code;
        this.headers = {
            'content-type': 'text/plain'
        };
        this._emitter = new EmptyEmitter(this);
    }

    status(code: number) {
        return this.code = code;
    }

    withEmitter(emitter: Emitter) {
        this._emitter = emitter;
    }

    emitter(): Emitter {
        return this._emitter;
    }

    text(body: string) {
        this.body = body;
        this._emitter = new TextEmitter(this);

        return this;
    }

    html(body: string) {
        this.body = body;
        this._emitter = new HtmlEmitter(this);

        return this;
    }

    json(body: Object) {
        this.body = body;
        this._emitter = new JsonEmitter(this)

        return this;
    }

    stream(source: Readable) {
        this._emitter = new StreamingEmitter(this, source);

        return this;
    }

    attachment(file: PathLike) {
        this._emitter = new AttachmentEmitter(this, file);

        return this;
    }
}