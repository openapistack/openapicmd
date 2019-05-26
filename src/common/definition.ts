import * as SwaggerParser from 'swagger-parser';
import * as YAML from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

export const CONFIG_FILENAME = '.openapiconfig';

interface ParseOpts {
  definition: string;
  dereference?: boolean;
  validate?: boolean;
  servers?: string[];
}
export async function parseDefinition({
  definition,
  dereference,
  validate,
  servers,
}: ParseOpts): Promise<SwaggerParser.Document> {
  let method = SwaggerParser.parse;
  if (dereference) {
    method = SwaggerParser.dereference;
  }
  if (validate) {
    method = SwaggerParser.validate;
  }
  const document = await method.bind(SwaggerParser)(definition);

  // add servers
  if (servers) {
    const serverObjects = servers.map((url) => ({ url }));
    document.servers = document.servers ? [...document.servers, ...serverObjects] : serverObjects;
  }
  return document;
}

export enum OutputFormat {
  JSON = 'json',
  YAML = 'yaml',
}

interface OutputOpts {
  document: SwaggerParser.Document;
  format?: OutputFormat;
}
export function stringifyDocument({ document, format }: OutputOpts): string {
  if (format === OutputFormat.JSON) {
    // JSON output
    return JSON.stringify(document, null, 2);
  } else {
    // YAML output
    return YAML.safeDump(document, { noRefs: true, lineWidth: 240, noArrayIndent: true });
  }
}

// walk backwards from cwd until homedir and check if CONFIG_FILENAME exists
export function resolveConfigFile() {
  let dir = path.resolve(process.cwd());
  while (dir.length >= homedir().length) {
    const check = path.join(dir, CONFIG_FILENAME);
    if (fs.existsSync(check)) {
      return path.join(dir, CONFIG_FILENAME);
    } else {
      // walk backwards
      dir = path.resolve(path.join(dir, '..'));
    }
  }
}

export function resolveDefinition(definitionArg: string) {
  // check definitionArg
  if (definitionArg && definitionArg !== 'CURRENT') {
    return definitionArg;
  }

  if (process.env.OPENAPI_DEFINITION && definitionArg !== 'CURRENT') {
    return process.env.OPENAPI_DEFINITION;
  }

  const configFile = resolveConfigFile();
  if (configFile) {
    const config = YAML.safeLoad(fs.readFileSync(configFile));
    return config.definition;
  }
}
