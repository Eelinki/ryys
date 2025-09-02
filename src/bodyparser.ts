import  {type Request} from "./request";
import {PublicError} from "./exception";
import {
    isMultipartRequest,
    MaxFileSizeExceededError,
    MultipartParseError, MultipartPart,
    parseMultipartRequest
} from '@remix-run/multipart-parser/node';
import getRawBody, {type RawBodyError} from 'raw-body';
import {fileTypeFromBuffer, type FileTypeResult} from "file-type";
import type {BodyParserOptions} from "./ryys";
import {writeFile} from "node:fs/promises";
import type {PathLike} from "node:fs";

export interface Parser {
    parse(request: Request): Promise<Object>
}

export class JsonParser implements Parser {
    constructor(private readonly bodyParserOptions: Required<BodyParserOptions>) {
    }

    async parse(request: Request): Promise<Object> {
        const body = await getRawBody(request.rawMessage, {
            length: request.rawMessage.headers['content-length'],
            limit: this.bodyParserOptions.bodyLimitBytes,
            encoding: true
        }).catch((error: RawBodyError) => {
            if (error.statusCode === 413) {
                throw new PublicError(413, 'Request size limit exceeded');
            } else if (error.statusCode === 400) {
                throw new PublicError(400, 'Invalid request length');
            }

            throw new PublicError(400, 'Failed to get the request body');
        })

        try {
            return JSON.parse(body);
        } catch (error) {
            throw new PublicError(400, 'Failed to parse JSON');
        }
    }
}

export class FormDataParser implements Parser {
    constructor(private bodyParserOptions: Required<BodyParserOptions>) {
    }

    async parse(request: Request): Promise<{formData: FormData, files: File[]}> {
        if (!isMultipartRequest(request.rawMessage)) {
            return Promise.reject('Request is not multipart');
        }

        const files: File[] = [];
        const formData = new FormData();
        try {
            for await (let part of parseMultipartRequest(request.rawMessage, { maxFileSize: this.bodyParserOptions.maxFileSizeBytes })) {
                if (!part.name) {
                    continue;
                }

                if (part.isFile) {
                    if (files.length >= this.bodyParserOptions.maxFiles) {
                        continue;
                    }
                    files.push(new File(part));
                } else {
                    formData.append(part.name, part.text)
                }
            }
        } catch (error) {
            if (error instanceof MaxFileSizeExceededError) {
                throw new PublicError(413, 'File size limit exceeded');
            } else if (error instanceof MultipartParseError) {
                throw new PublicError(400, 'Failed to parse multipart request');
            } else {
                console.error('Error parsing multipart request:', error);

                throw new PublicError(500);
            }
        }

        return {
            formData: formData,
            files: files
        };
    }
}

export class File {
    private fileTypeRes: FileTypeResult | undefined;

    constructor(private part: MultipartPart) {

    }

    async mime(): Promise<string> {
        return (await this.getFileType()).mime;
    }
    async ext(): Promise<string> {
        return (await this.getFileType()).ext;
    }

    private async getFileType(): Promise<FileTypeResult> {
        if (this.fileTypeRes) {
            return this.fileTypeRes;
        }
        const fileTypeRes = await fileTypeFromBuffer(this.part.arrayBuffer);
        if (!fileTypeRes) {
            throw new Error('Could not determine file type form buffer');
        }

        this.fileTypeRes = fileTypeRes;
        return this.fileTypeRes;
    }

    filename(): string {
        return this.part.filename ?? '';
    }

    name(): string {
        return this.part.name ?? '';
    }

    size(): number {
        return this.part.arrayBuffer.byteLength ?? 0;
    }

    moveTo(path: PathLike): Promise<void> {
        return writeFile(path, this.part.bytes);
    }
}