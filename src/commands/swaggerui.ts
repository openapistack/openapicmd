import * as fs from 'fs';
import * as path from 'path';
import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as serve from 'koa-static';
import { getAbsoluteFSPath } from 'swagger-ui-dist';
import * as SwaggerParser from 'swagger-parser';
import { Command, flags } from '@oclif/command';

export default class SwaggerUI extends Command {
  public static description = 'start a local Swagger UI instance';

  public static examples = ['$ openapi swaggerui', '$ openapi swaggerui -d ./openapi.yml'];

  public static flags = {
    help: flags.help({ char: 'h' }),
    definition: flags.string({ char: 'd', description: 'openapi definition file' }),
    url: flags.string({ char: 'u', description: 'openapi definition url' }),
    port: flags.integer({ char: 'p', description: 'port', default: 9000 }),
  };

  public static args = [];

  public async run() {
    const { flags } = this.parse(SwaggerUI);
    const { definition, port, url } = flags;

    const app = new Koa();
    const router = new Router();
    let document = null;

    const serveOpts: serve.Options = {};

    if (definition) {
      router.get('/openapi.json', async (ctx) => {
        ctx.body = await SwaggerParser.parse(definition);
      });
      document = './openapi.json';
    }

    if (url) {
      document = url;
    }

    const swaggerUIRoot = getAbsoluteFSPath();
    if (document) {
      const indexHTML = fs.readFileSync(path.join(swaggerUIRoot, 'index.html')).toString('utf8');
      router.get('/', (ctx) => {
        ctx.body = indexHTML.replace('https://petstore.swagger.io/v2/swagger.json', document);
      });
    }

    app.use(router.routes());
    app.use(serve(swaggerUIRoot, serveOpts));

    const server = app.listen(port);
    process.on('disconnect', () => server.close());

    this.log(`Swagger UI running at http://localhost:${port}`);
  }
}
