import { Command } from '@oclif/command';
import * as fs from 'fs';
import * as path from 'path';
import * as Router from 'koa-router';
import * as serve from 'koa-static';
import axios from 'axios';
import { escapeStringTemplateTicks, parseHeaderFlag } from '../common/utils';
import * as commonFlags from '../common/flags';
import { startServer, createServer } from '../common/koa';
import { resolveDefinition } from '../common/definition';

function getAbsoluteFSPath() {
  return path.dirname(require.resolve('swagger-editor-dist'));
}

export default class SwaggerEditor extends Command {
  public static description = 'Start a Swagger Editor instance';

  public static examples = ['$ openapi swagger-editor', '$ openapi swagger-editor ./openapi.yml'];

  public static flags = {
    ...commonFlags.help(),
    ...commonFlags.serverOpts(),
    ...commonFlags.header(),
  };

  public static args = [
    {
      name: 'definition',
      description: 'input definition file',
    },
  ];

  public async run() {
    const { args, flags } = this.parse(SwaggerEditor);
    const { port, logger, header } = flags;

    const definition = resolveDefinition(args.definition);

    const app = createServer({ logger });
    const router = new Router();
    let document = null;

    if (definition) {
      if (definition.match('://')) {
        const { data } = await axios.get(definition, { headers: parseHeaderFlag(header) });
        document = data;
      } else {
        document = fs.readFileSync(definition);
      }
    }

    const swaggerEditorRoot = getAbsoluteFSPath();
    if (document) {
      const indexHTML = fs.readFileSync(path.join(swaggerEditorRoot, 'index.html')).toString('utf8');
      router.get('/', (ctx) => {
        ctx.body = indexHTML.replace(
          'window.editor = editor',
          `editor.specActions.updateSpec(\`${escapeStringTemplateTicks(
            document.toString(),
          )}\`)\n\nwindow.editor = editor`,
        );
      });
    }

    app.use(router.routes());
    app.use(serve(swaggerEditorRoot));

    const { port: portRunning } = await startServer({ app, port });
    this.log(`Swagger Editor running at http://localhost:${portRunning}`);
    this.log();
  }
}
