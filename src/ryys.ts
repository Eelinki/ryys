import * as http from "node:http";
import {Request, type RequestHandler} from "./request";

export interface BodyParserOptions {
    bodyLimitBytes?: number;
    maxFiles?: number;
    maxFileSizeBytes?: number;
}

export interface RyysOptions {
    handler: RequestHandler;
    bodyParserOptions?: BodyParserOptions;
}

export class Ryys {
    server: http.Server;
    handler: RequestHandler;
    bodyParserOptions: Required<BodyParserOptions>;

    constructor(opts: RyysOptions) {
        this.server = http.createServer(this.handleRequest.bind(this));
        this.handler = opts.handler;
        const {
            bodyLimitBytes = 1048576, // Default: 1 MB
            maxFiles = 10,
            maxFileSizeBytes = 5242880 // Default: 5 MB
        } = opts.bodyParserOptions || {};

        this.bodyParserOptions = {
            bodyLimitBytes,
            maxFiles,
            maxFileSizeBytes
        };
    }

    private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
        const response = await this.handler.handle(new Request(req, this.bodyParserOptions));
        const emitter = response.emitter();

        try {
            await emitter.emit(res);
        } catch (e) {
            console.error('Unhandled error during emit:', e);

            res.writeHead(500);
            res.end();
        }
    }

    public listen(port: number): void {
        this.server.listen(port, () => {
            console.log(`Server listening on port ${port}`);
        });
    }
}