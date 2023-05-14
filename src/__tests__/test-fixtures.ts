import { Definition, Operation, Parameter, RequestBody } from '../types/types';



export const createDefinition = (overrides?: Partial<Definition>): Definition => {
  return {
    openapi: '3.0.0',
    servers: [],
    paths: {},
    ...overrides,
    info: {
      title: 'My API',
      version: '0.0.1',
      ...overrides?.info
    },
  }
}


export const createOperation = (overrides?: Partial<Operation>): Operation => {
  return {
    operationId: 'operationId',
    responses: {},
    ...overrides,
  }
}

export const createParameter = (overrides?: Partial<Parameter>): Parameter => {
  return {
    name: 'name',
    in: 'query',
    ...overrides,
  }
}


export const createRequestBody = (overrides?: Partial<RequestBody>): RequestBody => {
  return {
    content: {},
    ...overrides,
  }
}

