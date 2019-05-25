import { flags } from '@oclif/command';
import { IOptionFlag, IBooleanFlag } from '@oclif/parser/lib/flags';

export const help = (overrides: Partial<IBooleanFlag<boolean>> = {}) => ({
  help: flags.help({ char: 'h', ...overrides }),
});

export const definition = (overrides: Partial<IOptionFlag<string>> = {}) => ({
  definition: flags.string({
    char: 'd',
    description: 'openapi definition file',
    helpValue: './openapi.yml',
    ...overrides,
  }),
});

export const servers = () => ({
  server: flags.string({
    char: 'S',
    description: 'add servers to definition',
    helpValue: 'http://localhost:9000',
    multiple: true,
  }),
});

export const parseOpts = () => ({
  dereference: flags.boolean({ char: 'D', description: 'resolve $ref pointers' }),
  validate: flags.boolean({ char: 'V', description: 'validate against openapi schema' }),
  ...servers(),
});

export const port = (overrides: Partial<IOptionFlag<number>> = {}) => ({
  port: flags.integer({
    char: 'p',
    description: 'port',
    default: 9000,
    helpValue: '9000',
    ...overrides,
  }),
});

export const outputFormat = () => ({
  format: flags.enum({
    char: 'f',
    description: '[default: yaml] output format',
    options: ['json', 'yaml', 'yml'],
    exclusive: ['json', 'yaml'],
  }),
  json: flags.boolean({ description: 'format as json (short for -f json)', exclusive: ['format', 'yaml'] }),
  yaml: flags.boolean({ description: 'format as yaml (short for -f yaml)', exclusive: ['format', 'json'] }),
});
