import exp = require('constants');
import * as testFixtures from '../__tests__/test-fixtures';
import { stripDefinition } from './strip-definition';

describe('stripDefinition', () => {
  it('should not modify original document', () => {
    // given
    const document = testFixtures.createDefinition()

    // when
    const output = stripDefinition(document);

    // then
    expect(output).not.toBe(document);
  })


  describe('opts.replaceInfo', () => {
    it('should replace info', () => {
      // given
      const document = testFixtures.createDefinition()

      // when
      const output = stripDefinition(document, { replaceInfo: true });

      // then
      expect(output.info).toHaveProperty('title', '');
      expect(output.info).toHaveProperty('version', '');
      expect(output.info).not.toHaveProperty('description');
      expect(output.info).not.toHaveProperty('contact');
      expect(output.info).not.toHaveProperty('license');
      expect(output.info).not.toHaveProperty('termsOfService');
    })
  })

  describe('opts.removeTags', () => {
    it('should remove tags from root', () => {
      // given
      const document = testFixtures.createDefinition({
        tags: [
          { name: 'tag1' },
          { name: 'tag2' },
        ]
      })

      // when
      const output = stripDefinition(document, { removeTags: true });

      // then
      expect(output).not.toHaveProperty('tags');
    })

    it('should remove tags from operations', () => {
      // given
      const document = testFixtures.createDefinition({
        paths: {
          '/path1': {
            get: testFixtures.createOperation({
              tags: ['tag1', 'tag2'],
            }),
          },
          '/path2': {
            get: testFixtures.createOperation({
              tags: ['tag1'],
            }),
          },
        },
      })

      // when
      const output = stripDefinition(document, { removeTags: true });

      // then
      expect(output.paths['/path1'].get).not.toHaveProperty('tags');
      expect(output.paths['/path2'].get).not.toHaveProperty('tags');
    })
  })

  describe('opts.removeDescriptions', () => {
    it('should remove descriptions from info', () => {
      // given
      const document = testFixtures.createDefinition({
        info: {
          title: 'title',
          version: 'version',
          description: 'description',
        },
      })

      // when
      const output = stripDefinition(document, { removeDescriptions: true, replaceInfo: false });

      // then
      expect(output.info).not.toHaveProperty('description');
    })

    it('should remove descriptions and summaries from operations', () => {
      // given
      const document = testFixtures.createDefinition({
        paths: {
          '/path1': {
            get: testFixtures.createOperation({
              description: 'description',
              summary: 'summary',
            }),
          },
          '/path2': {
            get: testFixtures.createOperation({
              description: 'description',
              summary: 'summary',
            }),
          },
        },
      })

      // when
      const output = stripDefinition(document, { removeDescriptions: true });

      // then
      expect(output.paths['/path1'].get).not.toHaveProperty('description');
      expect(output.paths['/path1'].get).not.toHaveProperty('summary');
      expect(output.paths['/path2'].get).not.toHaveProperty('description');
      expect(output.paths['/path2'].get).not.toHaveProperty('summary');
    })

    it('should remove descriptions from parameters', () => {
      // given
      const document = testFixtures.createDefinition({
        paths: {
          '/path1': {
            get: testFixtures.createOperation({
              parameters: [
                testFixtures.createParameter({
                  description: 'description',
                }),
                testFixtures.createParameter({
                  description: 'description',
                }),
              ],
            }),
          },
          '/path2': {
            get: testFixtures.createOperation({
              parameters: [
                testFixtures.createParameter({
                  description: 'description',
                }),
              ],
            }),
          },
        },
      })

      // when
      const output = stripDefinition(document, { removeDescriptions: true });

      // then
      expect(output.paths['/path1'].get.parameters[0]).not.toHaveProperty('description');
      expect(output.paths['/path1'].get.parameters[1]).not.toHaveProperty('description');
      expect(output.paths['/path2'].get.parameters[0]).not.toHaveProperty('description');
    })

    it('should remove descriptions from responses', () => {
      // given
      const document = testFixtures.createDefinition({
        paths: {
          '/path1': {
            get: testFixtures.createOperation({
              responses: {
                '200': {
                  description: 'description',
                },
                '400': {
                  description: 'description',
                },
              },
            }),
          },
          '/path2': {
            get: testFixtures.createOperation({
              responses: {
                '200': {
                  description: 'description',
                },
              },
            }),
          },
        },
      })

      // when
      const output = stripDefinition(document, { removeDescriptions: true });

      // then
      expect(output.paths['/path1'].get.responses['200']['description']).toEqual('')
      expect(output.paths['/path1'].get.responses['400']['description']).toEqual('')
      expect(output.paths['/path2'].get.responses['200']['description']).toEqual('')
    })

    it('should remove descriptions from requestBody', () => {
      // given
      const document = testFixtures.createDefinition({
        paths: {
          '/path1': {
            post: testFixtures.createOperation({
              requestBody: testFixtures.createRequestBody({
                description: 'description',
              }),
            }),
          },
          '/path2': {
            put: testFixtures.createOperation({
              requestBody: testFixtures.createRequestBody({
                description: 'description',
              })
            }),
          },
        },
      })

      // when
      const output = stripDefinition(document, { removeDescriptions: true });

      // then
      expect(output.paths['/path1'].post.requestBody).not.toHaveProperty('description');
      expect(output.paths['/path2'].put.requestBody).not.toHaveProperty('description');
    })

    it('should remove descriptions from schemas', () => {
      // given
      const document = testFixtures.createDefinition({
        paths: {
          '/path1': {
            post: testFixtures.createOperation({
              parameters: [
                testFixtures.createParameter({
                  schema: {
                    description: 'description',
                  },
                }),
              ],
              requestBody: testFixtures.createRequestBody({
                content: {
                  'application/json': {
                    schema: {
                      description: 'description',
                    },
                  },
                },
              }),
              responses: {
                '201': {
                  description: '',
                  content: {
                    'application/json': {
                      schema: {
                        description: 'description',
                      },
                    },
                  },
                },
              },
            }),
          },
        },
      })

      // when
      const output = stripDefinition(document, { removeDescriptions: true });

      // then
      expect(output.paths['/path1'].post.parameters[0]['schema']).not.toHaveProperty('description');
      expect(output.paths['/path1'].post.requestBody['content']['application/json'].schema).not.toHaveProperty('description');
      expect(output.paths['/path1'].post.responses['201']['content']['application/json'].schema).not.toHaveProperty('description');
    })

    it('should remove descriptions from components.schemas', () => {
      // given
      const document = testFixtures.createDefinition({
        components: {
          schemas: {
            'Schema1': {
              description: 'description',
            },
            'Schema2': {
              type: 'object',
              properties: {
                'property1': {
                  description: 'description',
                },
              }
            },
          },
        },
      })

      // when
      const output = stripDefinition(document, { removeDescriptions: true });

      // then
      expect(output.components.schemas['Schema1']).not.toHaveProperty('description');
      expect(output.components.schemas['Schema2']['properties']['property1']).not.toHaveProperty('description');
    })

    it('should remove descriptions from components.responses', () => {
      // given
      const document = testFixtures.createDefinition({
        components: {
          responses: {
            'Response1': {
              description: 'description',
            },
            'Response2': {
              description: 'description',
            },
          },
        },
      })

      // when
      const output = stripDefinition(document, { removeDescriptions: true });

      // then
      expect(output.components.responses['Response1']).not.toHaveProperty('description');
      expect(output.components.responses['Response2']).not.toHaveProperty('description');
    })

    it('should remove descriptions from components.parameters', () => {
      // given
      const document = testFixtures.createDefinition({
        components: {
          parameters: {
            'Parameter': {
              in: 'query',
              name: 'parameter',
              description: 'description',
            },
          },
        },
      })

      // when
      const output = stripDefinition(document, { removeDescriptions: true });

      // then
      expect(output.components.parameters['Parameter']).not.toHaveProperty('description');
    })

    it('should remove descriptions from components.requestBodies', () => {
      // given
      const document = testFixtures.createDefinition({
        components: {
          requestBodies: {
            'RequestBody': {
              description: 'description',
              content: {}
            },
          },
        },
      })

      // when
      const output = stripDefinition(document, { removeDescriptions: true });

      // then
      expect(output.components.requestBodies['RequestBody']).not.toHaveProperty('description');
    })

    it('should remove descriptions from components.securitySchemes', () => {
      // given
      const document = testFixtures.createDefinition({
        components: {
          securitySchemes: {
            'SecurityScheme': {
              name: 'x-api-key',
              type: 'apiKey',
              in: 'header',
              description: 'description',
            },
          },
        },
      })

      // when
      const output = stripDefinition(document, { removeDescriptions: true });

      // then
      expect(output.components.securitySchemes['SecurityScheme']).not.toHaveProperty('description');
    })

    it('should remove descriptions from server objects', () => {
      // given
      const document = testFixtures.createDefinition({
        servers: [
          {
            url: 'https://example.com',
            description: 'description',
          },
        ],
        paths: {
          '/path1': {
            servers: [
              {
                url: 'https://example.com',
                description: 'description',
              },
            ],
            get: testFixtures.createOperation({
              servers: [
                {
                  url: 'https://example.com',
                  description: 'description',
                },
              ],
            }),
          },
        }
      })

      // when
      const output = stripDefinition(document, { removeDescriptions: true });

      // then
      expect(output.servers[0]).not.toHaveProperty('description');
      expect(output.paths['/path1'].servers[0]).not.toHaveProperty('description');
      expect(output.paths['/path1'].get.servers[0]).not.toHaveProperty('description');
    })
  })

  describe('opts.removeExamples', () => {
    it('should remove examples from operations', () => {
      // given
      const document = testFixtures.createDefinition({
        paths: {
          '/path1': {
            post: testFixtures.createOperation({
              parameters: [
                testFixtures.createParameter({
                  schema: {
                    example: 'example',
                  },
                }),
              ],
              requestBody: testFixtures.createRequestBody({
                content: {
                  'application/json': {
                    schema: {
                      example: 'example',
                    },
                  },
                },
                // @ts-ignore
                examples: [
                  {
                    example: 'example',
                  }
                ]
              }),
              responses: {
                '201': {
                  description: '',
                  content: {
                    'application/json': {
                      schema: {
                        example: 'example',
                      },
                    },
                  },
                },
              },
            }),
          },
        },
      })

      // when
      const output = stripDefinition(document, { removeExamples: true });

      // then
      expect(output.paths['/path1'].post.parameters[0]['schema']).not.toHaveProperty('example');
      expect(output.paths['/path1'].post.requestBody['content']['application/json'].schema).not.toHaveProperty('example');
      expect(output.paths['/path1'].post.responses['201']['content']['application/json'].schema).not.toHaveProperty('example');
      expect(output.paths['/path1'].post.requestBody).not.toHaveProperty('examples');
    })

    it('should remove examples from component schemas', () => {
      // given
      const document = testFixtures.createDefinition({
        components: {
          schemas: {
            'Schema1': {
              example: 'example',
            },
            'Schema2': {
              type: 'object',
              properties: {
                'property1': {
                  // @ts-ignore
                  'x-example': 'example',
                },
              },
              example: {},
              examples: [],
            },
          },
        },
      })

      // when
      const output = stripDefinition(document, { removeExamples: true });

      // then
      expect(output.components.schemas['Schema1']).not.toHaveProperty('example');
      expect(output.components.schemas['Schema2']).not.toHaveProperty('example');
      expect(output.components.schemas['Schema2']).not.toHaveProperty('examples');
      expect(output.components.schemas['Schema2']['properties']['property1']).not.toHaveProperty('x-example');
    })
  })

  describe('opts.removeExtensions', () => {
    it('should remove extensions from paths', () => {
      // given
      const document = testFixtures.createDefinition({
        paths: {
          '/path1': {
            // @ts-ignore
            'x-extension': 'path',
            post: testFixtures.createOperation({
              'x-extension': 'operation',
              parameters: [
                testFixtures.createParameter({
                  schema: {
                    // @ts-ignore
                    'x-extension': 'schema',
                  },
                }),
              ],
              requestBody: testFixtures.createRequestBody({
                content: {
                  'application/json': {
                    schema: {
                      // @ts-ignore
                      'x-extension': 'schema',
                    },
                  },
                },
              }),
              responses: {
                '201': {
                  description: '',
                  content: {
                    'application/json': {
                      schema: {
                        // @ts-ignore
                        'x-extension': 'schema',
                      },
                    },
                  },
                },
              },
            }),
          },
        },
      })

      // when
      const output = stripDefinition(document, { removeExtensions: true });

      // then
      expect(output.paths['/path1']).not.toHaveProperty('x-extension');
      expect(output.paths['/path1'].post).not.toHaveProperty('x-extension');
      expect(output.paths['/path1'].post.parameters[0]['schema']).not.toHaveProperty('x-extension');
      expect(output.paths['/path1'].post.requestBody['content']['application/json'].schema).not.toHaveProperty('x-extension');
      expect(output.paths['/path1'].post.responses['201']['content']['application/json'].schema).not.toHaveProperty('x-extension');
    })

    it('should remove extensions from component schemas', () => {
      // given
      const document = testFixtures.createDefinition({
        components: {
          schemas: {
            'Schema1': {
              // @ts-ignore
              'x-extension': 'extension',
            },
            'Schema2': {
              type: 'object',
              properties: {
                'property1': {
                  // @ts-ignore
                  'x-extension': 'extension',
                },
              },
            },
          },
        },
      })

      // when
      const output = stripDefinition(document, { removeExtensions: true });

      // then
      expect(output.components.schemas['Schema1']).not.toHaveProperty('x-extension');
      expect(output.components.schemas['Schema2']['properties']['property1']).not.toHaveProperty('x-extension');
    })

    it('should remove extensions from root document', () => {
      // given
      const document = testFixtures.createDefinition({
        // @ts-ignore
        'x-extension': 'extension',
      })

      // when
      const output = stripDefinition(document, { removeExtensions: true });

      // then
      expect(output).not.toHaveProperty('x-extension');
    })
  })

  describe('opts.removeReadOnly', () => {
    it('should remove readOnly from schemas', () => {
      // given
      const document = testFixtures.createDefinition({
        paths: {
          '/path1': {
            post: testFixtures.createOperation({
              requestBody: testFixtures.createRequestBody({
                content: {
                  'application/json': {
                    schema: {
                      readOnly: true,
                    },
                  },
                },
              }),
              responses: {
                '201': {
                  description: '',
                  content: {
                    'application/json': {
                      schema: {
                        readOnly: true,
                      },
                    },
                  },
                },
              },
            }),
          },
        },
        components: {
          schemas: {
            'Schema1': {
              readOnly: true,
            },
            'Schema2': {
              type: 'object',
              properties: {
                'property1': {
                  readOnly: true,
                },
              }
            },
          },
        },
      })

      // when
      const output = stripDefinition(document, { removeReadOnly: true });

      // then
      expect(output.paths['/path1'].post.requestBody['content']['application/json'].schema).not.toHaveProperty('readOnly');
      expect(output.paths['/path1'].post.responses['201']['content']['application/json'].schema).not.toHaveProperty('readOnly');
      expect(output.components.schemas['Schema1']).not.toHaveProperty('readOnly');
      expect(output.components.schemas['Schema2']['properties']['property1']).not.toHaveProperty('readOnly');
    })
  })

  describe('opts.removeSchemas', () => {
    it('should remove components.schemas', () => {
      // given
      const document = testFixtures.createDefinition({
        components: {
          schemas: {
            'Schema1': {
              type: 'object',
            },
          },
        },
      })

      // when
      const output = stripDefinition(document, { removeSchemas: true });

      // then
      expect(output.components).not.toHaveProperty('schemas');
    })

    it('should remove operation response schemas', () => {
      // given
      const document = testFixtures.createDefinition({
        paths: {
          '/path1': {
            post: testFixtures.createOperation({
              responses: {
                '201': {
                  description: '',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                      }
                    },
                  },
                },
              },
            }),
          },
        }
      })

      // when
      const output = stripDefinition(document, { removeSchemas: true });

      // then
      expect(output.paths['/path1'].post.responses['201']['content']['application/json']).not.toHaveProperty('schema');
    })

    it('should remove operation requestBody schemas', () => {
      // given
      const document = testFixtures.createDefinition({
        paths: {
          '/path1': {
            post: testFixtures.createOperation({
              requestBody: testFixtures.createRequestBody({
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                    }
                  },
                },
              }),
            }),
          },
        }
      })

      // when
      const output = stripDefinition(document, { removeSchemas: true });

      // then
      expect(output.paths['/path1'].post.requestBody['content']['application/json']).not.toHaveProperty('schema');
    })

    it('should remove operation parameter schemas', () => {
      // given
      const document = testFixtures.createDefinition({
        paths: {
          '/path1': {
            post: testFixtures.createOperation({
              parameters: [
                testFixtures.createParameter({
                  schema: {
                    type: 'object',
                  },
                }),
              ],
            }),
          },
        }
      })

      // when
      const output = stripDefinition(document, { removeSchemas: true });

      // then
      expect(output.paths['/path1'].post.parameters[0]).not.toHaveProperty('schema');
    })

    it('should remove schemas from components.requestBodies', () => {
      // given
      const document = testFixtures.createDefinition({
        components: {
          requestBodies: {
            'RequestBody1': {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      })

      // when
      const output = stripDefinition(document, { removeSchemas: true });

      // then
      expect(output.components.requestBodies['RequestBody1']['content']['application/json']).not.toHaveProperty('schema');
    })

    it('should remove schemas from components.responses', () => {
      // given
      const document = testFixtures.createDefinition({
        components: {
          responses: {
            'Response1': {
              description: '',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      })

      // when
      const output = stripDefinition(document, { removeSchemas: true });

      // then
      expect(output.components.responses['Response1']['content']['application/json']).not.toHaveProperty('schema');
    })

    it('should remove schemas from components.parameters', () => {
      // given
      const document = testFixtures.createDefinition({
        components: {
          parameters: {
            'Parameter1': {
              in: 'query',
              name: 'param1',
              schema: {
                type: 'object',
              },
            },
          },
        },
      })

      // when
      const output = stripDefinition(document, { removeSchemas: true });

      // then
      expect(output.components.parameters['Parameter1']).not.toHaveProperty('schema');
    })
  })

  describe('opts.removeSecuritySchemes', () => {
    it('should remove components.securitySchemes', () => {
      // given
      const document = testFixtures.createDefinition({
        components: {
          securitySchemes: {
            'ApiKey': {
              type: 'apiKey',
              name: 'x-api-key',
              in: 'header',
            },
          },
        },
      })

      // when
      const output = stripDefinition(document, { removeSecuritySchemes: true });

      // then
      expect(output.components).not.toHaveProperty('securitySchemes');
    })

    it('should remove security requirements from paths', () => {
      // given
      const document = testFixtures.createDefinition({
        paths: {
          '/path1': {
            // @ts-ignore
            security: [],
            post: testFixtures.createOperation({
              security: [
                {
                  'ApiKey': [],
                },
              ],
            }),
          },
        }
      })

      // when
      const output = stripDefinition(document, { removeSecuritySchemes: true });

      // then
      expect(output.paths['/path1']).not.toHaveProperty('security');
      expect(output.paths['/path1'].post).not.toHaveProperty('security');
    })

    it('should remove root level security requirements', () => {
      // given
      const document = testFixtures.createDefinition({
        security: [],
      })

      // when
      const output = stripDefinition(document, { removeSecuritySchemes: true });

      // then
      expect(output).not.toHaveProperty('security');
    })
  })

  describe('opts.removeServers', () => {
    it('should remove servers', () => {
      // given
      const document = testFixtures.createDefinition({
        servers: [
          {
            url: 'https://example.com',
            description: 'description',
          },
        ],
        paths: {
          '/path1': {
            servers: [
              {
                url: 'https://example.com',
                description: 'description',
              },
            ],
            get: testFixtures.createOperation({
              servers: [
                {
                  url: 'https://example.com',
                  description: 'description',
                },
              ],
            }),
          },
        }
      })

      // when
      const output = stripDefinition(document, { removeServers: true });

      // then
      expect(output).not.toHaveProperty('servers');
      expect(output.paths['/path1']).not.toHaveProperty('servers');
      expect(output.paths['/path1'].get).not.toHaveProperty('servers');
    })
  })

  describe('replaceResponses', () => {
    it('should replace responses with minimal default response', () => {
      // given
      const document = testFixtures.createDefinition({
        paths: {
          '/path1': {
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
        }
      })

      // when
      const output = stripDefinition(document, { replaceResponses: true });

      // then
      expect(output.paths['/path1'].post.responses).toEqual({
        '2XX': {
          description: '',
        },
      })
      expect(output.paths['/path1'].post.responses).not.toHaveProperty('201');
      expect(output.paths['/path1'].post.responses).not.toHaveProperty('400');
    })
  })
})
