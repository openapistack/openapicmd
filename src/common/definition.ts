import * as SwaggerParser from 'swagger-parser';
import * as YAML from 'js-yaml';

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
  const document = method.bind(SwaggerParser)(definition);

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
