import { Command, flags } from '@oclif/command';
import * as path from 'path';
import * as Koa from 'koa';
import * as bodyparser from 'koa-bodyparser';
import OpenAPIBackend, { Document } from 'openapi-backend';

export default class Mock extends Command {
  public static description = 'describe the command here';

  public static examples = [`$ openapi mock ./openapi.yml`];

  public static flags = {
    help: flags.help({ char: 'h' }),
    port: flags.integer({ char: 'p', description: 'port', default: 9000 }),
  };

  public static args = [{ name: 'file', required: true }];

  public async run() {
    const { args, flags } = this.parse(Mock);
    await this.startMockServer(args.file, flags.port);
  }

  private async startMockServer(definition: string, port: number = 9000) {
    this.log(`Reading OpenAPI spec ${path.basename(definition)}...`);

    const api = new OpenAPIBackend({ definition });
    api.register({
      validationFail: (c, ctx) => {
        ctx.status = 400;
        ctx.body = { err: c.validation.errors };
      },
      notFound: (c, ctx) => {
        ctx.status = 404;
        ctx.body = { err: 'not found' };
      },
      notImplemented: (c, ctx) => {
        const { status, mock } = c.api.mockResponseForOperation(c.operation.operationId);
        ctx.status = status;
        ctx.body = mock;
      },
    });
    await api.init();

    this.displayRoutes(api.document);

    const app = new Koa();
    app.use(bodyparser());
    app.use((ctx) =>
      api.handleRequest(
        {
          method: ctx.request.method,
          path: ctx.request.path,
          body: ctx.request.body,
          query: ctx.request.query,
          headers: ctx.request.headers,
        },
        ctx,
      ),
    );
    const server = app.listen(port);
    process.on('disconnect', () => server.close());

    this.log(`\nMock server running at http://localhost:${port}`);
  }

  private displayRoutes(document: Document) {
    this.log('\nRoutes:');
    for (const path in document.paths) {
      if (document.paths[path]) {
        for (const method in document.paths[path]) {
          if (document.paths[path][method]) {
            this.log(`- ${method.toUpperCase()} ${path} - ${document.paths[path][method].operationId}`);
          }
        }
      }
    }
  }
}
