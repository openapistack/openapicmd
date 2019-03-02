import * as fs from 'fs';
import * as path from 'path';
import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as serve from 'koa-static';
import axios from 'axios';
import { Command, flags } from '@oclif/command';

function getAbsoluteFSPath() {
  return path.dirname(require.resolve('swagger-editor-dist'));
}

export default class SwaggerEditor extends Command {
  public static description = 'start a local Swagger UI instance';

  public static examples = ['$ openapi swagger-editor', '$ openapi swagger-editor -d ./openapi.yml'];

  public static flags = {
    help: flags.help({ char: 'h' }),
    port: flags.integer({ char: 'p', description: 'port', default: 9000, helpValue: '9000' }),
    definition: flags.string({
      char: 'd',
      description: 'openapi definition file',
      helpValue: './openapi.yml',
    }),
  };

  public static args = [];

  public async run() {
    const { flags } = this.parse(SwaggerEditor);
    const { definition, port } = flags;

    const app = new Koa();
    const router = new Router();
    let document = null;

    if (definition) {
      if (definition.match('://')) {
        const { data } = await axios.get(definition);
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
          `editor.specActions.updateSpec(\`${document}\`)\n\nwindow.editor = editor`,
        );
      });
    }

    app.use(router.routes());
    app.use(serve(swaggerEditorRoot));

    const server = app.listen(port);
    process.on('disconnect', () => server.close());

    this.log(`Swagger Editor running at http://localhost:${port}`);
  }
}
