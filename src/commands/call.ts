import { Command, flags } from '@oclif/command';
import cli from 'cli-ux';
import * as chalk from 'chalk';
import * as inquirer from 'inquirer';
import * as _ from 'lodash';
import OpenAPIClientAxios, { OpenAPIV3, AxiosRequestConfig, AxiosResponse } from 'openapi-client-axios';
import { parseDefinition, resolveDefinition } from '../common/definition';
import * as commonFlags from '../common/flags';
import { Document } from '@apidevtools/swagger-parser';
import d from 'debug';
import { isValidJson, parseHeaderFlag } from '../common/utils';
const debug = d('cmd');

export default class Call extends Command {
  public static description = 'Call API endpoints';

  public static examples = [
    `$ openapi call -o getPets`,
    `$ openapi call -o getPet -p id=1`,
    `$ openapi call -o createPet -d '{ "name": "Garfield" }'`,
  ];

  public static flags = {
    ...commonFlags.help(),
    ...commonFlags.parseOpts(),
    ...commonFlags.apiRoot(),
    operation: flags.string({ char: 'o', description: 'operationId', helpValue: 'operationId' }),
    param: flags.string({ char: 'p', description: 'parameter', helpValue: 'key=value', multiple: true }),
    data: flags.string({ char: 'd', description: 'request body' }),
    include: flags.boolean({
      char: 'i',
      description: 'include status code and response headers the output',
      default: false,
    }),
  };

  public static args = [
    {
      name: 'definition',
      description: 'input definition file',
    },
  ];

  public async run() {
    const { args, flags } = this.parse(Call);
    const { dereference, validate, bundle, header } = flags;

    const definition = resolveDefinition(args.definition);
    if (!definition) {
      this.error('Please load a definition file', { exit: 1 });
    }

    let document: Document;
    try {
      document = await parseDefinition({
        definition,
        dereference,
        bundle,
        validate,
        servers: flags.server,
        header,
        induceServers: true,
      });
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
          choices: api.getOperations().map((op) => {
            const { operationId: id, summary, description, method, path } = op;
            let name = `${method.toUpperCase()} ${path}`;
            if (summary) {
              name = `${name} - ${summary}`;
            } else if (description) {
              name = `${name} - ${description}`;
            }
            if (id) {
              name = `${name} (${id})`;
            }
            return { name, value: id };
          }),
        },
      ]);
      operationId = res.operation;
    }
    const operation = api.getOperation(operationId);
    if (!operation) {
      this.error(`operationId ${operationId} not found`);
    }

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
    const config: AxiosRequestConfig = { headers: parseHeaderFlag(header) };

    // handle request body
    const data = flags.data;

    // set content type
    if (!config.headers['Content-Type'] && !config.headers['content-type']) {
      const operationRequestContentType = Object.keys(operation.requestBody?.['content'] ?? {})[0];
      const defaultContentType = isValidJson(data) ? 'application/json' : 'text/plain';
      config.headers['Content-Type'] = operationRequestContentType ?? defaultContentType
    }

    let res: AxiosResponse;
    try {
      const request = api.getRequestConfigForOperation(operation, [params, data, config]);
      debug(request);
      if (operationId) console.warn(chalk.bold(operationId));
      console.warn(`${chalk.green(request.method.toUpperCase())} ${request.url}`);
      res = await client[operationId](params, data, config);
    } catch (err) {
      if (err.response) {
        res = err.response;
      } else {
        this.error(err.message, { exit: false });
      }
    }

    // output response fields
    if (flags.include) {
      this.log(chalk.gray('RESPONSE META:'));
      this.log(
        JSON.stringify(
          {
            code: res.status,
            status: res.statusText,
            headers: res.headers,
          },
          null,
          2,
        ),
      );
      this.log(chalk.gray('RESPONSE BODY:'));
    }

    // output response body
    if (!_.isNil(res.data)) {
      try {
        this.log(JSON.stringify(res.data, null, 2));
      } catch (e) {
        this.log(res.data);
      }
    } else {
      console.warn(chalk.gray('(empty response)'));
    }
  }
}
