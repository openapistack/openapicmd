import * as URL from 'url';
import * as fs from 'fs';
import * as path from 'path';
import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as serve from 'koa-static';
import * as SwaggerUIDist from 'swagger-ui-dist';

export const swaggerUIRoot = SwaggerUIDist.getAbsoluteFSPath();

export interface SwaggerUIOpts {
  documentPath?: string; // url to definition file
}
export function serveSwaggerUI({ documentPath }: SwaggerUIOpts = {}) {
  const app = new Koa();
  const router = new Router();

  const indexHTML = getSwaggerUIIndexHTML({ documentPath });

  // serve index.html
  router.get('/', (ctx) => {
    const url = ctx.originalUrl || ctx.url;
    const { pathname, query, hash } = URL.parse(url);
    // append trailing slash so relative paths work
    if (!pathname.endsWith('/')) {
      ctx.status = 302;
      return ctx.redirect(
        URL.format({
          pathname: `${pathname}/`,
          query,
          hash,
        }),
      );
    }
    ctx.body = indexHTML;
    ctx.status = 200;
  });

  app.use(router.routes());
  app.use(serve(swaggerUIRoot));

  return app;
}

export function getSwaggerUIIndexHTML({ documentPath }: SwaggerUIOpts = {}) {
  // modify index.html
  let indexHTML = fs
    .readFileSync(path.join(swaggerUIRoot, 'index.html'))
    .toString('utf8')
    // display operation ids
    .replace('layout: "StandaloneLayout"', 'layout: "StandaloneLayout", displayOperationId: true');

  if (documentPath) {
    // use our openapi definition
    indexHTML = indexHTML.replace('https://petstore.swagger.io/v2/swagger.json', documentPath);
  }
  return indexHTML;
}
