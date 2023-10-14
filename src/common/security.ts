import d from 'debug';
import * as deepMerge from 'deepmerge';
import { OpenAPIV3, Operation } from 'openapi-client-axios';
import { getConfigValue } from './config';
import { Document } from '@apidevtools/swagger-parser';
import { parseHeaderFlag } from './utils';
import { maybePrompt } from './prompt';
import { getContext } from './context';

const debug = d('cmd');

export const security = () => ({});

export interface SecurityConfig {
  [securityScheme: string]: RequestSecurityConfig;
}

export interface RequestSecurityConfig {
  header?: {
    [header: string]: string;
  };
  cookie?: {
    [cookie: string]: string;
  };
  query?: {
    [key: string]: string;
  };
  auth?: {
    username: string;
    password: string;
  };
}

export const createSecurityRequestConfig = async (params: {
  document: Document;
  operation?: Operation;
  security: string[];
  header: string[];
  token?: string;
  apikey?: string;
  username?: string;
  password?: string;
}): Promise<RequestSecurityConfig> => {
  let requestSecurityConfig: RequestSecurityConfig = {
    header: {},
    cookie: {},
    query: {},
  };

  if (
    Object.keys(parseHeaderFlag(params.header)).find((key) =>
      ['authorization', 'x-api-key', 'x-apikey', 'x-api-secret', 'x-secret'].includes(key.toLowerCase()),
    )
  ) {
    // if an authorization header is already set, just return that
    return requestSecurityConfig;
  }

  const securityScheme = await getActiveSecuritySchemes(params);
  debug('securityScheme %o', securityScheme);

  // read stored security config
  const securityConfig = getConfigValue('security', {}) as SecurityConfig;
  debug('securityConfig %o', securityConfig);

  for (const schemeName of securityScheme) {
    const stored = securityConfig[schemeName];
    if (stored) {
      // apply stored config
      requestSecurityConfig.header = { ...requestSecurityConfig.header, ...stored.header };
      requestSecurityConfig.cookie = { ...requestSecurityConfig.cookie, ...stored.cookie };
      requestSecurityConfig.query = { ...requestSecurityConfig.query, ...stored.query };
      if (stored.auth) {
        requestSecurityConfig.auth = stored.auth;
      }
    } else {
      const schemeDefinition = params.document.components.securitySchemes[schemeName] as OpenAPIV3.SecuritySchemeObject;

      // create new config
      requestSecurityConfig = deepMerge(
        requestSecurityConfig,
        await createSecurityRequestConfigForScheme({
          schemeName,
          schemeDefinition,
          token: params.token,
          apikey: params.apikey,
          username: params.apikey,
          password: params.password,
        }),
      );
    }
  }

  return applyFlagOverrides({ requestSecurityConfig, ...params });
};

export const getActiveSecuritySchemes = async (params: {
  document: Document;
  operation?: Operation;
  security: string[];
  header: string[];
  token?: string;
  apikey?: string;
  username?: string;
  password?: string;
  noInteractive?: boolean
}) => {
  const context = getContext();

  // choose security scheme
  const availableSecuritySchemes = getAvailableSecuritySchemes(params.document, params.operation);
  debug('availableSecuritySchemes %o', availableSecuritySchemes);

  const securitySchemes = new Set<string>();
  params.security?.forEach?.((scheme) => securitySchemes.add(scheme));

  if (!securitySchemes.size && availableSecuritySchemes.length === 1) {
    securitySchemes.add(availableSecuritySchemes[0].name);
  }

  // infer basic scheme if username + password is set
  if (params.username && params.password) {
    const basicScheme = availableSecuritySchemes.find(
      (s) => s.schemeDefinition?.type === 'http' && s.schemeDefinition?.scheme === 'basic',
    );
    if (basicScheme) {
      securitySchemes.add(basicScheme.name);
    }
  }

  // infer apikey scheme if apikey is set
  if (params.apikey) {
    const apikeyScheme = availableSecuritySchemes.find((s) => s.schemeDefinition?.type === 'apiKey');
    if (apikeyScheme) {
      securitySchemes.add(apikeyScheme.name);
    }
  }

  // infer bearer scheme if token is set
  if (params.token) {
    const bearerScheme = availableSecuritySchemes.find(
      (s) => s.schemeDefinition?.type === 'http' && s.schemeDefinition?.scheme === 'bearer',
    );
    if (bearerScheme) {
      securitySchemes.add(bearerScheme.name);
    }
  }

  // prompt security scheme choice unless it's obvious
  if (securitySchemes.has('PROMPT') || (securitySchemes.size !== 1 && availableSecuritySchemes.length > 1)) {
    const explicitSecurityScheme = (
      await maybePrompt({
        name: 'securityScheme',
        message: 'use security scheme',
        type: 'checkbox',
        choices: availableSecuritySchemes.map((s, idx) => ({
          name: [s.name, s.schemeDefinition?.['description']].filter(Boolean).join(': '),
          value: s.name,
          checked: idx === 0,
        })),
      })
    ).securityScheme;

    if (explicitSecurityScheme) {
      return explicitSecurityScheme;
    }
  }

  return [...securitySchemes];
};

export const createSecurityRequestConfigForScheme = async (params: {
  schemeName: string;
  schemeDefinition: OpenAPIV3.SecuritySchemeObject;
  token?: string;
  apikey?: string;
  username?: string;
  password?: string;
  noInteractive?: boolean
}): Promise<RequestSecurityConfig> => {
  let requestSecurityConfig: RequestSecurityConfig = {};

  // prompt for api key
  if (params.schemeDefinition?.type === 'apiKey') {
    const apiKey =
      params.apikey ??
      params.token ??
      (
        await maybePrompt({
          name: 'key',
          message: `${params.schemeName}: Set API key (${params.schemeDefinition.name})`,
          type: 'input',
        })
      )?.['key'];

    requestSecurityConfig = {
      [params.schemeDefinition.in]: {
        [params.schemeDefinition.name]: apiKey,
      },
    };
  }

  // prompt for bearer token
  if (params.schemeDefinition?.type === 'http' && params.schemeDefinition?.scheme === 'bearer') {
    const token =
      params.token ??
      (
        await maybePrompt({
          name: 'token',
          message: `${params.schemeName}: Set auth token`,
          type: 'input',
        })
      )?.['token'];

    requestSecurityConfig = {
      header: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  // prompt for basic auth credentials
  if (params.schemeDefinition?.type === 'http' && params.schemeDefinition?.scheme === 'basic') {
    const username =
      params.username ??
      (
        await maybePrompt({
          name: 'username',
          message: `${params.schemeName}: username`,
          type: 'input',
        })
      )?.['username'];
    const password =
      params.password ??
      (
        await maybePrompt({
          name: 'password',
          message: `${params.schemeName}: password`,
          type: 'password',
        })
      ) ?.['password'];

    requestSecurityConfig = {
      auth: { username, password },
    };
  }

  return applyFlagOverrides({ requestSecurityConfig, ...params });
};

export const applyFlagOverrides = (params: {
  requestSecurityConfig: RequestSecurityConfig;
  token?: string;
  apikey?: string;
  username?: string;
  password?: string;
}) => {
  const { requestSecurityConfig } = params;

  // apply flag overrides
  if (params.username) {
    requestSecurityConfig.auth = { ...requestSecurityConfig.auth, username: params.username };
  }
  if (params.password) {
    requestSecurityConfig.auth = { ...requestSecurityConfig.auth, password: params.password };
  }
  if (params.token) {
    requestSecurityConfig.header = { ...requestSecurityConfig.header, Authorization: `Bearer ${params.token}` };
  }

  return requestSecurityConfig;
};

export const getAvailableSecuritySchemes = (document: Document, operation: Operation) => {
  if (operation) {
    const availableSecuritySchemeNames = new Set<string>();
    for (const requirementObject of operation.security ?? []) {
      const securitySchemes = Object.keys(requirementObject);
      securitySchemes?.forEach((scheme) => availableSecuritySchemeNames.add(scheme));
    }

    return [...availableSecuritySchemeNames].map((name) => ({
      name,
      schemeDefinition: document.components?.securitySchemes?.[name] as OpenAPIV3.SecuritySchemeObject,
    }));
  } else {
    return Object.keys(document.components?.securitySchemes ?? {}).map((name) => ({
      name,
      schemeDefinition: document.components?.securitySchemes?.[name] as OpenAPIV3.SecuritySchemeObject,
    }));
  }
};
