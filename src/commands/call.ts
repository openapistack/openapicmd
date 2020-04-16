import { Command, flags } from '@oclif/command';
import cli from 'cli-ux';
import * as inquirer from 'inquirer';
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
      const { name, required, example, description } = param;

      if (!params[name]) {
        let prompt = name;
        if (description) {
          prompt = `${prompt} ${description}`;
        }
        const value = await cli.prompt(prompt, { required, default: example });
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
      this.log(JSON.stringify(res.data, null, 2));
    } catch (err) {
      this.error(err, { exit: 1 });
    }
  }
}
