import type {ServerResponse} from "node:http";
import {Readable} from "node:stream";
import {createReadStream, type PathLike} from "node:fs";
import {stat} from "node:fs/promises";
import {fileTypeFromStream} from "file-type";
import path from "node:path";
import {Response} from "./response";

export interface Emitter {
    emit(res: ServerResponse): void | Promise<void>;
}

export class JsonEmitter implements Emitter {
    constructor(private response: Response) {
        this.response.headers["content-type"] = 'application/json';
    }

    emit(res: ServerResponse): void {
        res.writeHead(this.response.code, this.response.headers);
        res.end(JSON.stringify(this.response.body));
    }
}

export class TextEmitter implements Emitter {
    constructor(private response: Response) {
        this.response.headers["content-type"] = 'text/plain';
    }

    emit(res: ServerResponse): void {
        res.writeHead(this.response.code, this.response.headers);
        res.end(this.response.body);
    }
}

export class HtmlEmitter implements Emitter {
    constructor(private response: Response) {
        this.response.headers["content-type"] = 'text/html';
    }

    emit(res: ServerResponse): void {
        res.writeHead(this.response.code, this.response.headers);
        res.end(this.response.body);
    }
}

export class EmptyEmitter implements Emitter {
    constructor(private response: Response) {}

    emit(res: ServerResponse): void {
        res.writeHead(this.response.code);
        res.end();
    }
}

export class StreamingEmitter implements Emitter {
    constructor(private response: Response, private source: Readable) {

    }

    emit(res: ServerResponse): void {
        this.response.headers['content-type'] = 'application/octet-stream';
        res.writeHead(this.response.code, this.response.headers);
        this.source.pipe(res);
    }
}

export class AttachmentEmitter implements Emitter {
    constructor(private response: Response, private file: PathLike) {

    }

    async emit(res: ServerResponse): Promise<void> {
        const fileStats = await stat(this.file).catch((e) => {
            throw new Error('Error reading file', { cause: e });
        });
        const fileType = await fileTypeFromStream(
            Readable.toWeb(createReadStream(this.file))
        );
        const basename = path.basename(this.file.toString());

        this.response.headers['content-type'] = fileType?.mime ?? 'application/octet-stream';
        this.response.headers['content-disposition'] = `attachment; filename=${basename}`;
        this.response.headers['content-length'] = fileStats.size;
        res.writeHead(this.response.code, this.response.headers);
        createReadStream(this.file).pipe(res);
    }
}
