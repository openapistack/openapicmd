import * as URL from 'url';
import * as Koa from 'koa';
import * as Router from 'koa-router';
import { html } from 'common-tags';

const CURRENT_REDOC_VERSION = '2.1.2'

export interface RedocOpts {
  title?: string;
  redocVersion?: string;
  specUrl?: string;
}
export function serveRedoc(opts: RedocOpts = {}) {
  const app = new Koa();
  const router = new Router();

  const indexHTML = getRedocIndexHTML(opts)

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

  return app;
}

export function getRedocIndexHTML(opts: RedocOpts = {}) {
  return html`<html>
  <head>
    <title>${opts.title || 'ReDoc documentation'}</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!--
    Redoc doesn't change outer page styles
    -->
    <style>
      body {
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <redoc spec-url='${opts.specUrl || 'http://petstore.swagger.io/v2/swagger.json'}'></redoc>
    <script src="https://cdn.redoc.ly/redoc/v${opts.redocVersion || CURRENT_REDOC_VERSION}/bundles/redoc.standalone.js"></script>
  </body>
</html>`
}
