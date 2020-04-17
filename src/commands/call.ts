import { Command, flags } from '@oclif/command';
import cli from 'cli-ux';
import * as chalk from 'chalk';
import * as inquirer from 'inquirer';
import { URL } from 'url';
import OpenAPIClientAxios, { OpenAPIV3, AxiosRequestConfig } from 'openapi-client-axios';
import { parseDefinition, resolveDefinition } from '../common/definition';
import * as commonFlags from '../common/flags';
import { Document } from 'swagger-parser';
import d from 'debug';
const debug = d('cmd');

export default class Call extends Command {
  public static description = 'call OpenAPI operations';

  public static examples = [
    `$ openapi call -o getPets`,
    `$ openapi call -o getPet -p id=1`,
    `$ openapi call -o createPet -d '{ "name": "Garfield" }'`,
  ];

  public static flags = {
    ...commonFlags.help(),
    ...commonFlags.parseOpts(),
    header: flags.string({ char: 'H', description: 'Add request headers', multiple: true }),
    operation: flags.string({ char: 'o', description: 'operationId', helpValue: 'operationId' }),
    param: flags.string({ char: 'p', description: 'parameter', helpValue: 'key=value', multiple: true }),
    data: flags.string({ char: 'd', description: 'request body' }),
    headers: flags.boolean({ char: 'i', description: 'include response headers the output', default: false }),
  };

  public static args = [
    {
      name: 'definition',
      description: 'input definition file',
    },
  ];

  public async run() {
    const { args, flags } = this.parse(Call);
    const { dereference, validate, bundle } = flags;

    const definition = resolveDefinition(args.definition);
    if (!definition) {
      this.error('Please load a definition file', { exit: 1 });
    }

    let document: Document;
    try {
      document = await parseDefinition({ definition, dereference, bundle, validate, servers: flags.server });
    } catch (err) {
      this.error(err, { exit: 1 });
    }

    if (definition.startsWith('http') || definition.startsWith('//')) {
      const inputURL = new URL(definition);
      document.servers = document.servers || [];
      const server = document.servers[0];
      if (!server) {
        document.servers[0] = { url: `${inputURL.protocol}//${inputURL.host}` };
      } else if (!server.url.startsWith('http') && !server.url.startsWith('//')) {
        document.servers[0] = { url: `${inputURL.protocol}//${inputURL.host}${server.url}` };
      }
    }

    const api = new OpenAPIClientAxios({ definition: document });
    const client = await api.init();

    // select operation
    let operationId = flags.operation;
    if (!operationId) {
      const res = await inquirer.prompt([
        {
          name: 'operation',
          message: 'select operation',
          type: 'list',
          choices: api.getOperations().map(({ operationId: id, summary }) => {
            let name = id;
            if (summary) {
              name = `${name} - ${summary}`;
            }
            return { name, value: id };
          }),
        },
      ]);
      operationId = res.operation;
    }
    const operation = api.getOperation(operationId);

    // fill params
    const params: { [key: string]: any } = {};
    for (const param of flags.param || []) {
      const [key, value] = param.split('=');
      params[key.trim()] = value;
    }

    for (const p of operation.parameters || []) {
      const param = p as OpenAPIV3.ParameterObject;
      const { name, required, example } = param;

      if (!params[name]) {
        const value = await cli.prompt(name, { required, default: example });
        params[name] = value;
      }
    }

    // add request headers
    const config: AxiosRequestConfig = { headers: {} };
    for (const header of flags.header || []) {
      const [name, value] = header.split(':');
      config.headers[name.trim()] = value.trim();
    }

    // handle request body
    const data = flags.data;

    try {
      const request = api.getRequestConfigForOperation(operation, [params, data, config]);
      debug(request);
      console.warn(`${request.method.toUpperCase()} ${request.url}`);
      const res = await client[operationId](params, data, config);
      if (flags.headers) {
        this.log(JSON.stringify(res.headers, null, 2));
      }
      if (res.data && res.data.length > 0) {
        try {
          this.log(JSON.stringify(res.data, null, 2));
        } catch (e) {
          this.log(res.data);
        }
      } else {
        console.warn(chalk.gray('(empty response)'));
      }
    } catch (err) {
      this.error(err.message, { exit: false });
      if (err.response) {
        console.error(JSON.stringify(err.response.data, null, 2));
      }
      process.exit(1);
    }
  }
}
