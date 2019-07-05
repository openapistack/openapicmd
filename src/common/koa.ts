import * as Koa from 'koa';
import * as logger from 'koa-logger';
import cli from 'cli-ux';
import { Server } from 'http';
import * as getPort from 'get-port';

interface CreateServerOpts {
  logger?: boolean;
}
export function createServer(opts: CreateServerOpts = {}) {
  const app = new Koa();

  // set up logging
  if (opts.logger || opts.logger === undefined) {
    app.use(logger());
  }
  return app;
}

interface StartServerOpts {
  app: Koa;
  port: number;
}
export async function startServer(opts: StartServerOpts) {
  let server: Server;
  const port = await getPort({ port: getPort.makeRange(opts.port, opts.port + 1000) });
  if (opts.port !== port) {
    if (
      !process.stdin.isTTY ||
      !(await cli.confirm(`Something else is running on port ${opts.port}. Use another port instead? (y/n)`))
    ) {
      process.exit(1);
    }
  }
  const { app } = opts;
  server = app.listen(port);
  process.on('disconnect', () => server.close());
  return { server, port };
}
