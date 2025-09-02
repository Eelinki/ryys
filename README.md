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