import { Command } from '@oclif/command';
import * as commonFlags from '../common/flags';
import { Document } from '@apidevtools/swagger-parser';
import * as path from 'path';
import * as fs from 'fs';
import * as YAML from 'js-yaml';
import { parseDefinition, resolveDefinition } from '../common/definition';
import { CONFIG_FILENAME, resolveConfigFile } from '../common/config';
import { createSecurityRequestConfigForScheme, getActiveSecuritySchemes, SecurityConfig } from '../common/security';
import { OpenAPIV3 } from 'openapi-client-axios';

export default class Auth extends Command {
  public static description = 'Authenticate with apis (writes to .openapiconfig)';

  public static examples = [
    `$ openapi auth`,
    '$ openapi auth --token eyJh...',
    '$ openapi auth --security ApiKeyAuth --apikey secret123',
    '$ openapi auth --security BasicAuth --username admin --password password',
  ];

  public static flags = {
    ...commonFlags.help(),
    ...commonFlags.validate(),
    ...commonFlags.parseOpts(),
    ...commonFlags.securityOpts(),
    ...commonFlags.inject(),
  };

  public static args = [
    {
      name: 'definition',
      description: 'input definition file',
    },
  ];

  public async run() {
    const { args, flags } = this.parse(Auth);
    const { dereference, validate, bundle, header, inject, token, apikey, username, password } = flags;
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
        inject,
        servers: flags.server,
        header,
      });
    } catch (err) {
      this.error(err, { exit: 1 });
    }

    // get config file
    const configFile = resolveConfigFile();
    const writeTo = path.resolve(configFile || `./${CONFIG_FILENAME}`);

    // write to config file
    const oldConfig = configFile ? YAML.safeLoad(fs.readFileSync(configFile)) : {};
    const newConfig = {
      ...oldConfig,
      definition,
      security: { ...oldConfig.security } as SecurityConfig,
    };

    // choose security schemes
    const securityScheme = await getActiveSecuritySchemes({
      document,
      security: flags.security,
      header,
      token,
      apikey,
      username,
      password,
    });

    for (const schemeName of securityScheme) {
      const schemeDefinition = document.components.securitySchemes[schemeName] as OpenAPIV3.SecuritySchemeObject;
      if (schemeDefinition) {
        newConfig.security[schemeName] = await createSecurityRequestConfigForScheme({
          schemeName,
          schemeDefinition,
          token,
          apikey,
          username,
          password,
        });
      }
    }

    // write as YAML
    fs.writeFileSync(writeTo, YAML.safeDump(newConfig));
    this.log(`Wrote auth config to ${writeTo}. You can now use openapi call with the following auth configs:`);
    this.log(
      `${Object.keys(newConfig.security)
        .map((key) => `- ${key}`)
        .join('\n')}`,
    );
  }
}
