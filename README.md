# RYYS!

A minimal web framework. Not production ready. Use at your own risk.

## Key concepts

- Every request is handled by a request handler
- A request handler returns a response
- Middleware are request handlers
- Routers are request handlers

## Example

```typescript
import * as Ryys from 'ryys';
import Index from "./RequestHandler/Index.js";
import DateLoader from "./Middleware/DateLoader.js";


// define routes
const routes = new Ryys.RegexMatch([
    ['/$', new Index()],
]); 

// middleware chain
const router = new Ryys.ErrorHandler(
    new Ryys.CookieParser(
        new DateLoader(routes)
    )
);

const opts: Ryys.RyysOptions = {
    handler: router
};

const app = new Ryys.Ryys(opts);
app.listen(8123);
```

Request handler

```typescript
import * as Ryys from 'ryys';

export default class Index implements Ryys.RequestHandler {
    async handle(request: Ryys.Request): Promise<Ryys.Response> {
        return new Ryys.Response().html(`<p>Ryys!</p>`);
    }
}
```

Middleware

```typescript
import * as Ryys from 'ryys';

export default class DateLoader implements Ryys.Middleware {
    next: Ryys.RequestHandler;

    constructor(next: Ryys.RequestHandler) {
        this.next = next;
    }

    async handle(request: Ryys.Request): Promise<Ryys.Response> {
        let date = new Date();
        request.store().set('date', date);

        return await this.next.handle(request);
    }
}
```

## Router

Ryys comes with a `RegexMatch` router. If no matches are found, the router throws a `NotFoundError`.
Routes are defined using a tuple that consists of a regular expression and a RequestHandler.

Any named capture groups in the regex are extracted and saved as attributes on the `Request` object.

Examples:
```typescript
const routes = new Ryys.RegexMatch([
    ['/$', new Index()],
    ['/api', new ApiRouter()], // note the missing $
    ['/users/(?<id>[0-9]+)$', new UserProfile()],
    ['/posts/(?<year>[0-9]{4})/(?<title>[a-z-]+)$', new BlogPost()],
]);
```

The saved attributes can then be accessed in a RequestHandler:

```typescript
// BlogPost.ts
//
const attributes = request.attributes();
const postYear = request.attribute('year');

// by using destructuring:
const [year, title] = request.attributes();
```

## Built-in middleware

Ryys comes with some built-in middleware. None of them are enabled by default,
so you have to include them in your middleware stack if you want to use them.

- `CookieParser`
- `ErrorHandler`

Note that you must handle thrown exceptions manually if you don't use the built-in ErrorHandler middleware.

## Request

- `attribute(name, [defaultValue = '']): string`: Attributes are extracted from the request URI in the router.
- `queryParam(name, [defaultValue = '']): string`: Gets the value of a specific query parameter.
- `cookie(name, [defaultValue = '']): string`: Retrieves the value of a specific cookie. Requires cookies being set first by
  using `setCookies()`. The CookieParser middleware can do this for you.

### Body parsing (asynchronous)

Parsing only occurs on the first call, and is then stored in the request for later access.

- `json()`: Parses a JSON body and returns the resulting object.
- `multipart()`: Handles multipart and form data, returning a `FormData` object and an array of files.

### Context

- `store()`: Returns a `Map` for storing and sharing context throughout the request's lifecycle.

## Response

Each response has an emitter that sends the response to the client.

### Emitters:

- `EmptyEmitter` (default)
- `AttachmentEmitter`
- `HtmlEmitter`
- `JsonEmitter`
- `StreamingEmitter`
- `TextEmitter`