import { runCLI } from '@jest/core';
import { Document } from '@apidevtools/swagger-parser';
import type { Config } from '@jest/types';
import { Command, Flags } from '@oclif/core';
import * as commonFlags from '../../common/flags';
import * as path from 'path';
import d from 'debug';
import { getConfigValue } from '../../common/config';
import { TestConfig } from '../../tests/tests';
import { parseDefinition, resolveDefinition } from '../../common/definition';
import { setContext } from '../../common/context';
import { maybePrompt } from '../../common/prompt';
const debug = d('cmd');

export class Test extends Command {
  public static description = 'Run automated tests against APIs';

  public static examples = [
    `$ openapi test`,
    `$ openapi test -o getPets`,
  ];

  public static flags = {
    ...commonFlags.help(),
    ...commonFlags.parseOpts(),
    ...commonFlags.interactive(),
    operation: Flags.string({ char: 'o', description: 'filter by operationId', helpValue: 'operationId', multiple: true }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'verbose mode',
      default: false,
    }),
    ...commonFlags.securityOpts(),
  };

  public async run() {
    const { args, flags } = await this.parse(Test);
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

    const testConfig: TestConfig = getConfigValue('tests');

    if (!testConfig) {
      this.error('No tests configured. Please run `test add` first', { exit: 1 });
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

    const jestArgv: Config.Argv = {
      ...flags,
      $0: 'jest',
      _: [],
      passWithNoTests: true,
      verbose: true,
    }

    // filter tests by operation
    if (flags.operation) {
      jestArgv.testNamePattern = flags.operation.map((o) => `${o} `).join('|');
    }

    const testFile = require.resolve('../../tests/run-jest');
    const testProjectDir = path.dirname(testFile)

    jestArgv.noStackTrace = true;
    jestArgv.rootDir = testProjectDir;
    jestArgv.runTestsByPath = true;
    jestArgv.runInBand = true;
    jestArgv._ = [testFile];

    // set no interactive mode for jest
    setContext((ctx) => ({ ...ctx, flags: { ...ctx.flags, interactive: false } }))

    debug('jestArgv', jestArgv);
    await runCLI(jestArgv, [testProjectDir]);
  }
}
