import * as Koa from 'koa';
import cli from 'cli-ux';
import { Server } from 'http';
import * as getPort from 'get-port';

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
      !(await cli.confirm(`Something else is running on port ${port}. Use another port instead? (y/n)`))
    ) {
      process.exit(1);
    }
  }
  const { app } = opts;

  // set up cors
  app.use(async (ctx, next) => {
    await next();
    ctx.set('access-control-allow-origin', '*');
  });

  server = app.listen(port);
  process.on('disconnect', () => server.close());
  return { server, port };
}
