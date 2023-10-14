import { Command, Flags, Args } from '@oclif/core';
import { CONFIG_FILENAME, resolveConfigFile } from '../../common/config';
import { mock } from 'mock-json-schema';
import * as YAML from 'js-yaml';
import cli from 'cli-ux';
import * as path from 'path';
import * as fs from 'fs';
import * as inquirer from 'inquirer';
import OpenAPIClientAxios, { OpenAPIV3, AxiosRequestConfig } from 'openapi-client-axios';
import { parseDefinition, resolveDefinition } from '../../common/definition';
import * as commonFlags from '../../common/flags';
import { Document } from '@apidevtools/swagger-parser';
import d from 'debug';
import { isValidJson, parseHeaderFlag } from '../../common/utils';
import { createSecurityRequestConfig } from '../../common/security';
import { TEST_CHECKS, TestCheck, TestConfig } from '../../tests/tests';
const debug = d('cmd');

export class TestAdd extends Command {
  public static description = 'Add automated tests for API operations';

  public static examples = [
    `$ openapi test add`,
    `$ openapi test add -o getPet`,
    `$ openapi test add -o getPet --name "with id=1"`,
  ];

  public static flags = {
    ...commonFlags.help(),
    ...commonFlags.parseOpts(),
    ...commonFlags.apiRoot(),
    operation: Flags.string({ char: 'o', description: 'operationId', helpValue: 'operationId' }),
    name: Flags.string({ char: 'n', description: 'test name', helpValue: 'my test' }),
    checks: Flags.string({ char: 'c', description: 'checks to include in test', helpValue: '2XXStatus', multiple: true, options: TEST_CHECKS }),
    param: Flags.string({ char: 'p', description: 'parameter', helpValue: 'key=value', multiple: true }),
    data: Flags.string({ char: 'd', description: 'request body' }),
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
    const { args, flags } = await this.parse(TestAdd);
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
        inject: flags.inject,
        strip: flags.strip,
        header,
        induceServers: true,
      });
    } catch (err) {
      this.error(err, { exit: 1 });
    }

    const api = new OpenAPIClientAxios({ definition: document });

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

    // give test name
    let testName = flags.name;
    if (!testName) {
      testName = await cli.prompt('Test name', { required: true, default: 'call operation' })
    }

    // configure checks
    let checks = flags.checks as TestCheck[];
    if (!checks?.length) {
      checks = await inquirer.prompt({
        name: 'checks',
        message: 'checks to include in test',
        type: 'checkbox',
        choices: [{
          name: '2XX response',
          value: 'Success2XX' as TestCheck,
          checked: true,
        }]
      }).then((res) => res.checks);
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
      const { name, required, example } = param;

      if (!params[name] && required) {
        const value = await cli.prompt(name, { required, default: example });
        params[name] = value;
      }
    }

    // handle request body
    let data = flags.data;
    if (
      !data &&
      operation.requestBody &&
      'content' in operation.requestBody &&
      (await inquirer.prompt({ type: 'confirm', default: true, name: 'yes', message: 'add request body?' })).yes
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
        await inquirer.prompt({
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

    const configFile = resolveConfigFile();

    // write to config file
    const oldConfig = configFile ? YAML.load(fs.readFileSync(configFile)) : {};

    const newConfig = {
      ...oldConfig,
      definition,
      tests: {
        ...oldConfig.tests,
        [operationId]: {
          ...oldConfig.tests?.[operationId],
          [testName]: {
            checks,
            request: {
              params,
              data,
              config,
            },
          }
        }
      } as TestConfig
    };

    // default to current directory
    const writeTo = path.resolve(configFile || `./${CONFIG_FILENAME}`);

    // write as YAML
    fs.writeFileSync(writeTo, YAML.dump(newConfig));
    this.log(`Wrote to ${writeTo}`);
  }
}
