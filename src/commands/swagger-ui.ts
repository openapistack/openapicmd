import { Command, flags } from '@oclif/command';
import * as fs from 'fs';
import * as path from 'path';
import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as serve from 'koa-static';
import * as SwaggerUIDist from 'swagger-ui-dist';
import * as commonFlags from '../common/flags';
import { parseDefinition } from '../common/definition';

export default class SwaggerUI extends Command {
  public static description = 'serve or bundle a Swagger UI instance';

  public static examples = ['$ openapi swagger-ui', '$ openapi swagger-ui -d ./openapi.yml'];

  public static flags = {
    ...commonFlags.help(),
    ...commonFlags.definition(),
    ...commonFlags.port(),
    ...commonFlags.servers(),
    // @TODO
    /*bundle: flags.string({
      char: 'B',
      description: 'bundle a static site to directory',
      helpValue: 'swagger-ui',
    }),*/
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
        // use remote definition
        document = definition;
      } else {
        // parse definition
        router.get('/openapi.json', async (ctx) => {
          const def = await parseDefinition({ definition });
          if (flags.server) {
            const addServers = flags.server.map((url) => ({ url }));
            def.servers = def.servers ? [...def.servers, ...addServers] : addServers;
          }
          ctx.body = def;
        });
        document = '/openapi.json';
      }
    }

    const swaggerUIRoot = SwaggerUIDist.getAbsoluteFSPath();
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
