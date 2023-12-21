import { Command, Flags, Args } from '@oclif/core';
import { mock } from 'mock-json-schema';
import * as chalk from 'chalk';
import * as _ from 'lodash';
import OpenAPIClientAxios, { OpenAPIV3, AxiosRequestConfig, AxiosResponse } from 'openapi-client-axios';
import { parseDefinition, resolveDefinition } from '../common/definition';
import * as commonFlags from '../common/flags';
import { Document } from '@apidevtools/swagger-parser';
import d from 'debug';
import { isValidJson, parseHeaderFlag } from '../common/utils';
import { createSecurityRequestConfig } from '../common/security';
import { setContext } from '../common/context';
import { maybePrompt, maybeSimplePrompt } from '../common/prompt';
const debug = d('cmd');

export class Call extends Command {
  public static description = 'Call API endpoints';

  public static examples = [
    `$ openapi call -o getPets`,
    `$ openapi call -o getPet -p id=1`,
    `$ openapi call -o createPet -d '{ "name": "Garfield" }'`,
  ];

  public static flags = {
    ...commonFlags.help(),
    ...commonFlags.parseOpts(),
    ...commonFlags.interactive(),
    ...commonFlags.apiRoot(),
    operation: Flags.string({ char: 'o', description: 'operationId', helpValue: 'operationId' }),
    param: Flags.string({ char: 'p', description: 'parameter', helpValue: 'key=value', multiple: true }),
    data: Flags.string({ char: 'd', description: 'request body' }),
    include: Flags.boolean({
      char: 'i',
      description: 'include status code and response headers the output',
      default: false,
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'verbose mode',
      default: false,
    }),
    ...commonFlags.securityOpts(),
  };

  public static args = {
    definition: Args.string({
      description: 'input definition file'
    })
  }

  public async run() {
    const { args, flags } = await this.parse(Call);
    const { dereference, validate, bundle, header } = flags;

    // store flags in context
    setContext((ctx) => ({ ...ctx, flags }))

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
        inject: flags.inject,
        strip: flags.strip,
        excludeExt: flags?.['exclude-ext'],
        removeUnreferenced: flags?.['remove-unreferenced'],
        header,
        induceServers: true,
      });

    } catch (err) {
      this.error(err, { exit: 1 });
    }

    // make sure we have a server in the document
    if (!document.servers?.some((s) => s.url)) {
      const res = await maybePrompt({
        name: 'server',
        message: 'please enter a server URL',
        type: 'input',
        default: 'http://localhost:9000',
        // must be a valid URL
        validate: (value) => {
          try {
            new URL(value);
            return true;
          } catch (err) {
            return 'must be a valid URL';
          }
        }
      });

      if (res.server) {
        document.servers = [{ url: res.server }];
      } else {
        this.error('no server URL provided, use --server or modify your API spec', { exit: 1 });
      }
    }

    // store document in context
    setContext((ctx) => ({ ...ctx, document }))

    const api = new OpenAPIClientAxios({ definition: document });
    const client = await api.init();

    // don't throw on error statuses
    client.defaults.validateStatus = () => true;

    // select operation
    let operationId = flags.operation;
    if (!operationId) {
      const res = await maybePrompt([
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
    if (!operationId) {
      this.error(`no operationId passed, please specify --operation`, { exit: 1 });
    }
    const operation = api.getOperation(operationId);
    if (!operation) {
      this.error(`operationId ${operationId} not found`, { exit: 1 });
    }

    // fill params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: { [key: string]: any } = {};
    for (const param of flags.param || []) {
      const [key, value] = param.split('=');
      params[key.trim()] = value;
    }

    for (const p of operation.parameters || []) {
      const param = p as OpenAPIV3.ParameterObject;
      const { name, required, example, schema } = param;

      if (!params[name] && required) {
        const mockedValue = schema ? mock(schema as OpenAPIV3.SchemaObject) : undefined;

        const value = await maybeSimplePrompt(name, { required, default: example ?? mockedValue });
        params[name] = value;
      }
    }

    // handle request body
    let data = flags.data;
    if (
      !data &&
      operation.requestBody &&
      'content' in operation.requestBody &&
      (await maybePrompt({ type: 'confirm', default: true, name: 'yes', message: 'add request body?' })).yes
    ) {
      const contentType = Object.keys(operation.requestBody.content)[0];

      let defaultValue = operation.requestBody.content?.[contentType]?.example;
      if (!defaultValue && operation.requestBody.content?.[contentType]?.schema) {
        defaultValue = JSON.stringify(
          mock(operation.requestBody.content?.[contentType]?.schema as OpenAPIV3.SchemaObject),
          null,
          2,
        );
      }
      if (!defaultValue && contentType === 'application/json') {
        defaultValue = '{}';
      }

      data = (
        await maybePrompt({
          type: 'editor',
          message: contentType || '',
          name: 'requestBody',
          default: defaultValue,
          validate: (value) => {
            if (contentType === 'application/json' && !isValidJson(value)) {
              return 'invalid json';
            }
            return true;
          },
        })
      ).requestBody;
    }

    const securityRequestConfig = await createSecurityRequestConfig({
      document,
      operation,
      security: flags.security,
      header: flags.header,
      apikey: flags.apikey,
      token: flags.token,
      username: flags.username,
      password: flags.password,
    });
    debug('securityRequestConfig %o', securityRequestConfig);

    // add cookies
    const cookies = {
      ...securityRequestConfig.cookie,
    };
    const cookieHeader = Object.keys(cookies)
      .map((key) => `${key}=${cookies[key]}`)
      .join('; ');

    // add request headers
    const config: AxiosRequestConfig = {
      headers: {
        ...securityRequestConfig.header,
        ...parseHeaderFlag(header),
        ...(Boolean(cookieHeader) && { cookie: cookieHeader }),
      },
      params: {
        ...securityRequestConfig.query,
      },
      auth: securityRequestConfig.auth,
    };

    // set content type
    if (!config.headers['Content-Type'] && !config.headers['content-type']) {
      const operationRequestContentType = Object.keys(operation.requestBody?.['content'] ?? {})[0];
      const defaultContentType = isValidJson(data) ? 'application/json' : 'text/plain';
      config.headers['Content-Type'] = operationRequestContentType ?? defaultContentType;
    }

    let res: AxiosResponse;
    try {
      const request = api.getAxiosConfigForOperation(operation, [params, data, config]);
      debug('request %o', request);
      if (flags.verbose) {
        console.warn(JSON.stringify(request, null, 2));
      }
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
    if (flags.include && res?.status) {
      this.log(chalk.gray('RESPONSE META:'));
      this.logJson({
        code: res.status,
        status: res.statusText,
        headers: res.headers,
      });
      this.log(chalk.gray('RESPONSE BODY:'));
    }

    // output response body
    if (!_.isNil(res?.data)) {
      try {
        this.logJson(res.data);
      } catch (e) {
        this.log(res.data);
      }
    } else {
      console.warn(chalk.gray('(empty response)'));
    }
  }
}
