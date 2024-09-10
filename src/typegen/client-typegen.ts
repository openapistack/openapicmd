import * as _ from 'lodash';
import * as indent from 'indent-string';
import OpenAPIClientAxios, { Document, HttpMethod, Operation } from 'openapi-client-axios';
import DTSGenerator from '@anttiviljami/dtsgenerator/dist/core/dtsGenerator';
import { JsonSchema, parseSchema } from '@anttiviljami/dtsgenerator';

interface TypegenOptions {
  transformOperationName?: (operation: string) => string;
  disableOptionalPathParameters?: boolean;
}

interface ExportedType {
  name: string;
  path: string;
  schemaRef: string;
}

// rule from 'dts-generator' jsonSchema.ts
function convertKeyToTypeName(key: string): string {
  key = key.replace(/\/(.)/g, (_match: string, p1: string) => {
    return p1.toUpperCase();
  });
  return key
    .replace(/}/g, '')
    .replace(/{/g, '$')
    .replace(/^\//, '')
    .replace(/[^0-9A-Za-z_$]+/g, '_');
}

export async function generateClientTypesForDocument(definition: Document, opts: TypegenOptions) {
  const normalizedSchema = normalizeSchema(definition);

  const schema = parseSchema(normalizedSchema as JsonSchema);

  const generator = new DTSGenerator([schema]);

  const schemaTypes = await generator.generate();
  const exportedTypes: ExportedType[] = generator.getExports();

  const api = new OpenAPIClientAxios({ definition: normalizedSchema as Document });
  await api.init();
  
  const operationTypings = generateClientOperationMethodTypings(api, exportedTypes, opts);
  const rootLevelAliases = generateRootLevelAliases(exportedTypes);

  const imports = [
    'import type {',
    '  OpenAPIClient,',
    '  Parameters,',
    '  UnknownParamsObject,',
    '  OperationResponse,',
    '  AxiosRequestConfig,',
    `} from 'openapi-client-axios';`,
  ].join('\n');

  return { imports, schemaTypes, operationTypings, rootLevelAliases };
}

function generateClientOperationMethodTypings(
  api: OpenAPIClientAxios,
  exportTypes: ExportedType[],
  opts: TypegenOptions,
) {
  const operations = api.getOperations();

  const operationTypings = operations
    .map((op) => {
      return op.operationId
        ? generateMethodForClientOperation(opts.transformOperationName(op.operationId), op, exportTypes, opts)
        : null;
    })
    .filter((op) => Boolean(op));

  const pathOperationTypes = _.entries(api.definition.paths).map(([path, pathItem]) => {
    const methodTypings: string[] = [];
    for (const m in pathItem) {
      if (pathItem[m as HttpMethod] && _.includes(Object.values(HttpMethod), m)) {
        const method = m as HttpMethod;
        const operation = _.find(operations, { path, method });
        if (operation.operationId) {
          const methodForOperation = generateMethodForClientOperation(method, operation, exportTypes, opts);
          methodTypings.push(methodForOperation);
        }
      }
    }
    return [`['${path}']: {`, ...methodTypings.map((m) => indent(m, 2)), '}'].join('\n');
  });

  return [
    'export interface OperationMethods {',
    ...operationTypings.map((op) => indent(op, 2)),
    '}',
    '',
    'export interface PathsDictionary {',
    ...pathOperationTypes.map((p) => indent(p, 2)),
    '}',
    '',
    'export type Client = OpenAPIClient<OperationMethods, PathsDictionary>',
  ].join('\n');
}


function generateMethodForClientOperation(
  methodName: string,
  operation: Operation,
  exportTypes: ExportedType[],
  opts: TypegenOptions,
) {
  const { operationId, summary, description } = operation;

  // parameters arg
  const normalizedOperationId = convertKeyToTypeName(operationId);
  const normalizedPath = convertKeyToTypeName(operation.path);

  const pathParameterTypePaths = _.chain([
    _.find(exportTypes, { schemaRef: `#/paths/${normalizedOperationId}/pathParameters` }),
    _.find(exportTypes, { schemaRef: `#/paths/${normalizedPath}/pathParameters` }),
  ])
    .filter()
    .map('path')
    .value();

  const parameterTypePaths = _.chain([
    _.find(exportTypes, { schemaRef: `#/paths/${normalizedOperationId}/queryParameters` }),
    _.find(exportTypes, { schemaRef: `#/paths/${normalizedPath}/queryParameters` }),
    _.find(exportTypes, { schemaRef: `#/paths/${normalizedOperationId}/headerParameters` }),
    _.find(exportTypes, { schemaRef: `#/paths/${normalizedPath}/headerParameters` }),
    _.find(exportTypes, { schemaRef: `#/paths/${normalizedOperationId}/cookieParameters` }),
    _.find(exportTypes, { schemaRef: `#/paths/${normalizedPath}/cookieParameters` }),
  ])
    .filter()
    .map('path')
    .value()
    .concat(pathParameterTypePaths);

  const parametersType = !_.isEmpty(parameterTypePaths) ? parameterTypePaths.join(' & ') : 'UnknownParamsObject';
  let parametersArg = `parameters?: Parameters<${parametersType}> | null`;

  if (opts.disableOptionalPathParameters && !_.isEmpty(pathParameterTypePaths)) {
    parametersArg = `parameters: Parameters<${parametersType}>`;
  }

  // payload arg
  const requestBodyType = _.find(exportTypes, { schemaRef: `#/paths/${normalizedOperationId}/requestBody` });
  const dataArg = `data?: ${requestBodyType ? requestBodyType.path : 'any'}`;

  // return type
  const responseTypePaths = _.chain(exportTypes)
    .filter(({ schemaRef }) => schemaRef.startsWith(`#/paths/${normalizedOperationId}/responses/2`))
    .map(({ path }) => path)
    .value();
  const responseType = !_.isEmpty(responseTypePaths) ? responseTypePaths.join(' | ') : 'any';
  const returnType = `OperationResponse<${responseType}>`;

  const operationArgs = [parametersArg, dataArg, 'config?: AxiosRequestConfig'];
  const operationMethod = `'${methodName}'(\n${operationArgs
    .map((arg) => indent(arg, 2))
    .join(',\n')}  \n): ${returnType}`;

  // comment for type
  const content = _.filter([summary, description]).join('\n\n');
  const comment =
    '/**\n' +
    indent(content === '' ? operationId : `${operationId} - ${content}`, 1, {
      indent: ' * ',
      includeEmptyLines: true,
    }) +
    '\n */';

  return [comment, operationMethod].join('\n');
}

const generateRootLevelAliases = (exportedTypes: ExportedType[]) => {
  const aliases: string[] = [];

  for (const exportedType of exportedTypes) {
    if (exportedType.schemaRef.startsWith('#/components/schemas/')) {
      const name = exportedType.schemaRef.replace('#/components/schemas/', '');
      aliases.push([
        `export type ${name} = ${exportedType.path};`,
      ].join('\n'));
    }
  }

  return aliases.join('\n');
};

const normalizeSchema = (schema: Document): Document => {
  const clonedSchema: Document = _.cloneDeep(schema);

  // dtsgenerator doesn't generate parameters correctly if they are $refs to Parameter Objects
  // so we resolve them here
  for (const path in clonedSchema.paths ?? {}) {
    const pathItem = clonedSchema.paths[path];
    for (const method in pathItem) {
      const operation = pathItem[method as HttpMethod];
      if (operation.parameters) {
        operation.parameters = operation.parameters.map((parameter) => {
          if ('$ref' in parameter) {
            const refPath = parameter.$ref.replace('#/', '').replace(/\//g, '.');
            const resolvedParameter = _.get(clonedSchema, refPath);
            return resolvedParameter ?? parameter;
          }
          return parameter;
        });
      }
    }
  }

  // make sure schema is plain JSON with no metadata
  return JSON.parse(JSON.stringify(clonedSchema));
};
