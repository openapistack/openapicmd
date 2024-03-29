import { Command, Flags, Args } from '@oclif/core';
import { CONFIG_FILENAME, Config, resolveConfigFile } from '../../common/config';
import { mock } from 'mock-json-schema';
import * as YAML from 'js-yaml';
import * as path from 'path';
import * as fs from 'fs';
import OpenAPIClientAxios, { OpenAPIV3, AxiosRequestConfig } from 'openapi-client-axios';
import { parseDefinition, resolveDefinition } from '../../common/definition';
import * as commonFlags from '../../common/flags';
import { Document } from '@apidevtools/swagger-parser';
import d from 'debug';
import { isValidJson, parseHeaderFlag } from '../../common/utils';
import { createSecurityRequestConfig } from '../../common/security';
import { TEST_CHECKS, TestCheck, TestConfig } from '../../tests/tests';
import { maybePrompt, maybeSimplePrompt } from '../../common/prompt';
import { setContext } from '../../common/context';
import _ = require('lodash');
const debug = d('cmd');

export class TestAdd extends Command {
  public static description = 'Add automated tests for API operations';

  public static examples = [
    `$ openapi test add`,
    `$ openapi test add -o getPet --checks all`,
  ];

  public static flags = {
    ...commonFlags.help(),
    ...commonFlags.parseOpts(),
    ...commonFlags.apiRoot(),
    auto: Flags.boolean({ description: 'auto generate tests for all operations', default: false }),
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
    ...commonFlags.interactive(),
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

    if (flags.auto) {
      // dont prompt in auto mode
      flags.interactive = false;
    }

    // store flags in context
    setContext((ctx) => ({ ...ctx, flags }))

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
    await api.init();

    // select operation
    let operationId = flags.operation;
    
    if (!flags.auto) {
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
    }

    // give test name
    let testName = flags.name;
    if (!testName) {
      testName = (await maybePrompt({
        name: 'testName',
        message: 'test name',
        default: 'call operation'
      })).testName;
    }

    // configure checks
    let checks = flags.checks as TestCheck[];
    if (!checks?.length && flags.auto) {
      // default checks only
      checks = ['Success2XX', 'ValidResponseBody']
    }

    if (!checks?.length && !flags.auto) {
      checks = await maybePrompt({
        name: 'checks',
        message: 'checks to include in test',
        type: 'checkbox',
        choices: [{
          name: '2XX response',
          value: 'Success2XX' as TestCheck,
          checked: true,
        },
        {
          name: 'Validate Response Body',
          value: 'ValidResponseBody' as TestCheck,
          checked: true,
        }]
      }).then((res) => res.checks);
    }

    const operationsToAddTests = flags.auto ? api.getOperations() : [api.getOperation(operationId)];

    const testsToAdd: TestConfig = {};

    for (const operation of operationsToAddTests) {
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

      const config: AxiosRequestConfig = {};

      // add cookies
      const cookies = {
        ...securityRequestConfig.cookie,
      };
      const cookieHeader = Object.keys(cookies)
        .map((key) => `${key}=${cookies[key]}`)
        .join('; ');

      // add request headers
      config.headers = {
        ...securityRequestConfig.header,
        ...parseHeaderFlag(header),
        ...(Boolean(cookieHeader) && { cookie: cookieHeader }),
      };

      // add query params
      if (Object.keys({ ...securityRequestConfig.query }).length) {
        config.params = securityRequestConfig.query;
      }

      // add basic auth
      if (Object.keys({ ...securityRequestConfig.auth }).length) {
        config.auth = securityRequestConfig.auth;
      }

      // set content type
      if (!config.headers['Content-Type'] && !config.headers['content-type']) {
        const operationRequestContentType = Object.keys(operation.requestBody?.['content'] ?? {})[0];
        const defaultContentType = isValidJson(data) ? 'application/json' : undefined;
        config.headers['Content-Type'] = operationRequestContentType ?? defaultContentType;
      }

      testsToAdd[operation.operationId] = {
        ...testsToAdd[operation.operationId],
        [testName]: {
          checks,
          request: {
            params,
            data,
            config,
          },
        },
      };
      this.log(`Added ${checks.length === 1 ? `test` : `${checks.length} tests`} for ${operation.operationId} "${testName}"`);
    }

    const configFile = resolveConfigFile();

    // write to config file
    const oldConfig: Config = configFile ? YAML.load(fs.readFileSync(configFile).toString()) : {};

    const newConfig = {
      ...oldConfig,
      definition,
      tests: {
        ...oldConfig.tests,
        ..._.mapValues(testsToAdd, (tests, operationId) => ({
          ...oldConfig.tests?.[operationId],
          ...tests,
        })),
      }
    };

    // default to current directory
    const writeTo = path.resolve(configFile || `./${CONFIG_FILENAME}`);

    // write as YAML
    fs.writeFileSync(writeTo, YAML.dump(newConfig, { noRefs: true }));
    this.log(`Wrote to ${writeTo}`);
    
    this.log(`You can now run tests with \`${this.config.bin} test\``);
  }
}
