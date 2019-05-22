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

  public static examples = ['$ openapi swagger-ui', '$ openapi swagger-ui -d ./openapi.yml'];

  public static flags = {
    help: flags.help({ char: 'h' }),
    port: flags.integer({ char: 'p', description: 'port', default: 9000, helpValue: '9000' }),
    server: flags.string({
      char: 'S',
      description: 'add servers to definition',
      helpValue: 'http://localhost:9000',
      multiple: true,
    }),
    definition: flags.string({
      char: 'd',
      description: 'openapi definition file',
      helpValue: './openapi.yml',
    }),
  };

  public static args = [];

  public async run() {
    const { flags } = this.parse(SwaggerUI);
    const { definition, port } = flags;

    const app = new Koa();
    const router = new Router();
    let document = null;

    if (definition) {
      if (definition.match('://') && !flags.server) {
        document = definition;
      } else {
        router.get('/openapi.json', async (ctx) => {
          const def = await SwaggerParser.parse(definition);
          if (flags.server) {
            const addServers = flags.server.map((url) => ({ url }));
            def.servers = def.servers ? [...def.servers, ...addServers] : addServers;
          }
          ctx.body = def;
        });
        document = '/openapi.json';
      }
    }

    const swaggerUIRoot = getAbsoluteFSPath();
    if (document) {
      const indexHTML = fs.readFileSync(path.join(swaggerUIRoot, 'index.html')).toString('utf8');
      router.get('/', (ctx) => {
        ctx.body = indexHTML
          // use our openapi definition
          .replace('https://petstore.swagger.io/v2/swagger.json', document)
          // display operation ids
          .replace('layout: "StandaloneLayout"', 'layout: "StandaloneLayout", displayOperationId: true');
      });
    }

    app.use(router.routes());
    app.use(serve(swaggerUIRoot));

    const server = app.listen(port);
    process.on('disconnect', () => server.close());

    this.log(`Swagger UI running at http://localhost:${port}`);
  }
}
