import { PRESETS, stripDefinition } from './strip-definition';
import * as testFixtures from '../__tests__/test-fixtures';

describe('presets', () => {
  it.each([
    ['default', PRESETS.default,{
      "components": {
        "schemas": {
          "Response": {
            "type": "object"
          }
        }
      },
      "info": {
        "title": "",
        "version": ""
      },
      "openapi": "3.0.0",
      "paths": {
        "/path1": {
          "post": {
            "operationId": "operationId",
            "responses": {
              "201": {
                "content": {
                  "application/json": {
                    "schema": {
                      "type": "object"
                    }
                  }
                },
                "description": ""
              },
              "400": {
                "description": ""
              }
            }
          }
        },
        "/path2": {
          "get": {
            "operationId": "operationId",
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/Response"
                    }
                  }
                },
                "description": ""
              },
              "400": {
                "description": ""
              }
            }
          }
        }
      },
      "servers": []
    }],
    ['all', PRESETS.all,{
      "components": {},
      "info": {
        "title": "",
        "version": ""
      },
      "openapi": "3.0.0",
      "paths": {
        "/path1": {
          "post": {
            "operationId": "operationId",
            "responses": {}
          }
        },
        "/path2": {
          "get": {
            "operationId": "operationId",
            "responses": {}
          }
        }
      }
    }],
    ['openapi_client_axios', PRESETS.openapi_client_axios,{
      "components": {},
      "info": {
        "title": "",
        "version": ""
      },
      "openapi": "3.0.0",
      "paths": {
        "/path1": {
          "post": {
            "operationId": "operationId",
            "responses": {}
          }
        },
        "/path2": {
          "get": {
            "operationId": "operationId",
            "responses": {}
          }
        }
      },
      "servers": []
    }],
    ['openapi_backend', PRESETS.openapi_backend,{
      "components": {
        "schemas": {
          "Response": {
            "type": "object"
          }
        }
      },
      "info": {
        "title": "",
        "version": ""
      },
      "openapi": "3.0.0",
      "paths": {
        "/path1": {
          "post": {
            "operationId": "operationId",
            "responses": {
              "201": {
                "content": {
                  "application/json": {
                    "schema": {
                      "type": "object"
                    }
                  }
                },
                "description": ""
              },
              "400": {
                "description": ""
              }
            }
          }
        },
        "/path2": {
          "get": {
            "operationId": "operationId",
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/Response"
                    }
                  }
                },
                "description": ""
              },
              "400": {
                "description": ""
              }
            }
          }
        }
      }
    }]
  ]) ('should strip for %s preset', (label, preset, expected) => {
    // given
    const document = testFixtures.createDefinition({
      paths: {
        '/path1': {
          description: 'description',
          post: testFixtures.createOperation({
            responses: {
              '201': {
                description: 'Created',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                    },
                  },
                },
              },
              '400': {
                description: 'Bad Request',
              },
            },
          }),
        },
        '/path2': {
          get: testFixtures.createOperation({
            responses: {
              '200': {
                description: 'Created',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Response',
                    },
                  },
                },
              },
              '400': {
                description: 'Bad Request',
              },
            },
          }),
        },
      },
      components: {
        schemas: {
          Response: {
            type: 'object',
          }
        }
      }
    })

    // when
    const output = stripDefinition(document, preset);

    // then
    expect(output).toEqual(expected)
  })
})
