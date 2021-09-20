import * as URL from 'url';
import * as fs from 'fs';
import * as path from 'path';
import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as serve from 'koa-static';
import * as SwaggerUIDist from 'swagger-ui-dist';
import { Document } from '@apidevtools/swagger-parser';

export const swaggerUIRoot = SwaggerUIDist.getAbsoluteFSPath();

export enum DocExpansion {
  Full = 'full', // expand averything
  List = 'list', // expand only only tags
  None = 'none', // expand nothing
}

export interface SwaggerUIOpts {
  url?: string; // remote URL
  spec?: Document; // use a definition object instead of URL
  deepLinking?: boolean; // allow deep linking
  docExpansion?: DocExpansion; // default expansion setting for the operations and tags
  displayOperationId?: boolean; // display operationIds
  displayRequestDuration?: boolean; // display request durations in "try it out"
  showExtensions?: boolean; // display extensions
  showCommonExtensions?: boolean; // display common extensions
  withCredentials?: boolean; // send cookies with requests
  filter?: boolean | string; // enable filtering by tag
  layout?: string; // which layout to use (need to register plugins for this)
}
export function serveSwaggerUI(opts: SwaggerUIOpts = {}) {
  const app = new Koa();
  const router = new Router();

  const indexHTML = getSwaggerUIIndexHTML(opts);

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

export function getSwaggerUIIndexHTML(opts: SwaggerUIOpts = {}) {
  const config: SwaggerUIOpts = {
    layout: 'StandaloneLayout',
    deepLinking: true,
    displayOperationId: true,
    displayRequestDuration: true,
    showExtensions: true,
    showCommonExtensions: true,
    withCredentials: true,
    filter: true,
    ...opts,
  };
  return fs
    .readFileSync(path.join(swaggerUIRoot, 'index.html'))
    .toString('utf8')
    .replace('window.onload', `const config = JSON.parse(\'${JSON.stringify(config)}\');window.onload`)
    .replace('layout: "StandaloneLayout"', '...config');
}
