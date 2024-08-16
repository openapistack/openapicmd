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
      "openapi": "3.0.3",
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
      "servers": [
        {
          "url": "/test1"
        },
        {
          "url": "/test2"
        },
        {
          "url": "/test3"
        }
      ]
    }],
    ['all', PRESETS.all,{
      "components": {},
      "info": {
        "title": "",
        "version": ""
      },
      "openapi": "3.0.3",
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
      "openapi": "3.0.3",
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
      "servers": [{
        "url": "/test1"
      }]
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
      "openapi": "3.0.3",
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
      openapi: '3.0.3',
      info: {
        title: 'title',
        description: 'description',
        version: '1.0.0',
        contact: {
          name: 'test',
          email: 'test@example.com',
        }
      },
      servers: [
        { url: '/test1', description: 'description' },
        { url: '/test2', description: 'description' },
        { url: '/test3' }
      ],
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
