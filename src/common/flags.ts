import { Flags } from '@oclif/core';
import { BooleanFlag } from '@oclif/core/lib/interfaces';

export const help = (overrides: Partial<BooleanFlag<boolean>> = {}) => ({
  help: Flags.help({ char: 'h', ...overrides }),
});

export const servers = () => ({
  server: Flags.string({
    char: 'S',
    description: 'override servers definition',
    helpValue: 'http://localhost:9000',
    multiple: true,
  }),
});

export const inject = () => ({
  inject: Flags.string({
    char: 'I',
    description: 'inject JSON to definition with deep merge',
    helpValue: '{"info":{"version":"1.0.0"}}',
    multiple: true,
  }),
});

export const strip = () => ({
  strip: Flags.string({
    char: 'C',
    description: 'Strip optional metadata such as examples and descriptions from definition',
    helpValue: 'default|all|openapi_client_axios|openapi_backend',
  }),
});

export const validate = () => ({
  validate: Flags.boolean({ char: 'V', description: 'validate against openapi schema' }),
});

export const header = () => ({
  header: Flags.string({ char: 'H', description: 'add request headers when calling remote urls', multiple: true }),
});

export const apiRoot = () => ({
  root: Flags.string({ char: 'R', description: 'override API root path', helpValue: '/' }),
});

export const parseOpts = () => ({
  dereference: Flags.boolean({ char: 'D', description: 'resolve $ref pointers' }),
  bundle: Flags.boolean({ char: 'B', description: 'resolve remote $ref pointers' }),
  ...apiRoot(),
  ...header(),
  ...validate(),
  ...servers(),
  ...inject(),
  ...strip(),
});

export const serverOpts = () => ({
  port: Flags.integer({
    char: 'p',
    description: 'port',
    default: 9000,
    helpValue: '9000',
  }),
  logger: Flags.boolean({
    description: '[default: true] log requests',
    default: true,
    allowNo: true,
  }),
});

export const outputFormat = () => ({
  format: Flags.string({
    char: 'f',
    description: '[default: yaml] output format',
    options: ['json', 'yaml', 'yml'],
    exclusive: ['json', 'yaml'],
  }),
  json: Flags.boolean({ description: 'format as json (short for -f json)', exclusive: ['format', 'yaml'] }),
  yaml: Flags.boolean({ description: 'format as yaml (short for -f yaml)', exclusive: ['format', 'json'] }),
});

export const swaggerUIOpts = () => ({
  expand: Flags.string({
    description: '[default: list] default expansion setting for the operations and tags',
    options: ['full', 'list', 'none'],
  }),
  operationids: Flags.boolean({ description: '[default: true] display operationIds', default: true, allowNo: true }),
  filter: Flags.boolean({ description: '[default: true] enable filtering by tag', default: true, allowNo: true }),
  deeplinks: Flags.boolean({ description: '[default: true] allow deep linking', default: true, allowNo: true }),
  withcredentials: Flags.boolean({
    description: '[default: true] send cookies in "try it now"',
    default: true,
    allowNo: true,
  }),
  requestduration: Flags.boolean({
    description: '[default: true] display request durations in "try it now"',
    default: true,
    allowNo: true,
  }),
});

export const securityOpts = () => ({
  security: Flags.string({ char: 's', description: 'use security scheme', multiple: true }),
  apikey: Flags.string({ char: 'k', description: 'set api key' }),
  token: Flags.string({ char: 't', description: 'set bearer token' }),
  username: Flags.string({ char: 'u', description: 'set basic auth username' }),
  password: Flags.string({ char: 'p', description: 'set basic auth password' }),
});
