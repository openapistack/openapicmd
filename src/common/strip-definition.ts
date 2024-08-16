/* eslint-disable @typescript-eslint/no-explicit-any */
import { klona } from 'klona';
import { Definition } from '../types/types';

interface StripOptions {
  /**
   * Replace info with required fields only
   * @default true
   */
  replaceInfo?: boolean;
  /**
   * Remove tags from document
   * @default true
   */
  removeTags?: boolean;
  /**
   * Remove descriptions and summaries from document
   * @default true
   */
  removeDescriptions?: boolean;
  /**
   * Remove examples from document
   * @default true
   */
  removeExamples?: boolean;
  /**
   * Remove all openapi extensions (x-) from document
   * @default true
   */
  removeExtensions?: boolean;
  /**
   * Remove readOnly from document
   * @default true
   */
  removeReadOnly?: boolean;
  /**
   * Remove all schemas from document
   * @default false
   */
  removeSchemas?: boolean;
  /**
   * Remove all security schemes from document
   * @default false
   */
  removeSecuritySchemes?: boolean;
  /**
   * Remove servers from document
   * @default false
   */
  removeServers?: boolean;
  /**
   * Only include first server from servers array
   * @default false
   */
  firstServerOnly?: boolean;
  /**
   * Replace responses with minimal valid default response
   * @default false
   */
  replaceResponses?: boolean;
  /**
   * Remove responses entirely (warning: this will break validation)
   * @default false
   */
  removeResponses?: boolean;
}

const ALL: StripOptions = {
  replaceInfo: true,
  removeTags: true,
  removeDescriptions: true,
  removeExamples: true,
  removeExtensions: true,
  removeReadOnly: true,
  removeSchemas: true,
  removeSecuritySchemes: true,
  removeServers: true,
  replaceResponses: true,
  removeResponses: true,
}

const METADATA_ONLY: StripOptions = {
  replaceInfo: true,
  removeTags: true,
  removeDescriptions: true,
  removeExamples: true,
  removeExtensions: true,
  removeReadOnly: false,
  removeSchemas: false,
  removeSecuritySchemes: false,
  removeServers: false,
  replaceResponses: false,
  removeResponses: false,
}

export const PRESETS = {
  all: ALL,
  openapi_client_axios: {
    ...ALL,
    removeServers: false, // openapi-client-axios uses servers
    firstServerOnly: true, // openapi-client-axios only uses first server
  },
  openapi_backend: {
    ...METADATA_ONLY,
    removeExamples: false, // openapi-backend uses examples for mock responses
    removeServers: true, // openapi-backend does not use servers
  },
  default: METADATA_ONLY,
}

export type StripPreset = keyof typeof PRESETS;

/**
 * Strips optional metadata from definition
 */
export const stripDefinition = (document: Definition, options: StripOptions & { preset?: StripPreset } = {}): Definition => {
  const output = klona(document)

  const opts = { ...PRESETS[options.preset ?? 'default'], ...options }

  // replace info to required fields only
  if (opts.replaceInfo) {
    output.info = {
      title: '',
      version: ''
    }
  }

  // remove tags
  if (opts.removeTags) {
    // remove tags from root
    delete output.tags

    // remove tags from operations
    for (const path in output.paths) {
      if (output.paths[path]) {
        // path level tags
        delete output.paths[path]['tags']
        for (const method in output.paths[path]) {
          if (output.paths[path][method]) {
            delete output.paths[path][method].tags
          }
        }
      }
    }
  }

  // remove schemas
  if (opts.removeSchemas) {
    // remove components.schemas
    if (output.components?.schemas) {
      delete output.components.schemas
    }

    // recursively remove schemas
    const removeSchemas = (obj: any) => {
      if (typeof obj !== 'object') return

      for (const key in obj) {
        if (key === 'schema') {
          delete obj[key]
        } else {
          removeSchemas(obj[key])
        }
      }
    }

    // remove schemas from operations
    removeSchemas(output.paths)

    // remove schemas from requestBodies
    if (output.components?.requestBodies) {
      removeSchemas(output.components.requestBodies)
    }

    // remove schemas from requestBodies
    if (output.components?.responses) {
      removeSchemas(output.components.responses)
    }

    // remove schemas from parameters
    if (output.components?.parameters) {
      removeSchemas(output.components.parameters)
    }
  }

   // remove security schemes
   if (opts.removeSecuritySchemes) {
    // remove components.securitySchemes
    if (output.components?.securitySchemes) {
      delete output.components.securitySchemes
    }

    // remove security from root
    delete output.security;

    // remove security from paths
    for (const path in output.paths) {
      if (output.paths[path]) {
        // path level security
        delete output.paths[path]['security']
        for (const method in output.paths[path]) {
          if (output.paths[path][method]) {
            // operation level security
            delete output.paths[path][method].security
          }
        }
      }
    }
  }

  // remove servers
  if (opts.removeServers) {
    // remove servers from root
    delete output.servers;

    // remove servers from paths
    for (const path in output.paths) {
      if (output.paths[path]) {
        // path level servers
        delete output.paths[path].servers
        for (const method in output.paths[path]) {
          if (output.paths[path][method]) {
            // operation level servers
            delete output.paths[path][method].servers
          }
        }
      }
    }
  }

  // only keep first server
  if (opts.firstServerOnly && Array.isArray(output.servers) && output.servers.length > 1) {
    output.servers = [output.servers[0]]
  }

  // replace responses with minimal default response
  if (opts.replaceResponses) {
    for (const path in output.paths) {
      if (output.paths[path]) {
        for (const method in output.paths[path]) {
          if (output.paths[path][method]) {
            if (output.paths[path][method].responses) {
              output.paths[path][method].responses = {
                '2XX': { // prevents breaking validation
                  description: '',
                }
              }
            }
          }
        }
      }
    }
  }

  // remove responses completely
  if (opts.removeResponses) {
    for (const path in output.paths) {
      if (output.paths[path]) {
        for (const method in output.paths[path]) {
          if (output.paths[path][method]) {
            output.paths[path][method].responses = {}
          }
        }
      }
    }
  }

  // remove all descriptions and summaries
  if (opts.removeDescriptions) {
    // recursively remove nested description fields
    const removeDescriptions = (obj: any) => {
      if (typeof obj !== 'object') return

      for (const key in obj) {
        if (key === 'description' && typeof obj[key] === 'string') {
          delete obj[key]
        } else if (typeof obj[key] === 'object') {
          removeDescriptions(obj[key])
        }
      }
    }

    // remove descriptions from info
    delete output.info.description

    // remove descriptions and summaries from operations
    for (const path in output.paths) {
      if (output.paths[path]) {
        delete output.paths[path].description
        delete output.paths[path].summary
        
        // remove descriptions from path level servers
        if (output.paths[path].servers) {
          removeDescriptions(output.paths[path].servers)
        }

        for (const method in output.paths[path]) {
          if (output.paths[path][method]) {
            // operation summary and description
            delete output.paths[path][method].summary
            delete output.paths[path][method].description

            // remove descriptions from parameters
            if (output.paths[path][method].parameters) {
              removeDescriptions(output.paths[path][method].parameters)
            }

            // truncate descriptions from responses
            if (output.paths[path][method].responses) {
              for (const response in output.paths[path][method].responses) {
                if (output.paths[path][method].responses[response]) {
                  output.paths[path][method].responses[response].description = ''
                  // remove descriptions from content
                  removeDescriptions(output.paths[path][method].responses[response].content)
                }
              }
            }

            // remove descriptions from request bodies
            if (output.paths[path][method].requestBody) {
              removeDescriptions(output.paths[path][method].requestBody)
            }

            // remove descriptions from operation level servers
            if (output.paths[path][method].servers) {
              removeDescriptions(output.paths[path][method].servers)
            }
          }
        }
      }
    }

    // remove all description fields from components
    if (output.components) {
      removeDescriptions(output.components)
    }

    // remove description fields from servers
    if (output.servers) {
      removeDescriptions(output.servers)
    }
  }

  // remove all examples
  if (opts.removeExamples) {
    // recursively remove nested example fields
    const removeExamples = (obj: any) => {
      if (typeof obj !== 'object') return

      for (const key in obj) {
        if (['example', 'examples', 'x-example', 'x-examples'].includes(key)) {
          delete obj[key]
        } else if (typeof obj[key] === 'object') {
          removeExamples(obj[key])
        }
      }
    }

    // remove examples from operations
    removeExamples(output.paths)

    // remove examples from components
    if (output.components) {
      removeExamples(output.components)
    }
  }

   // remove all openapi extensions
   if (opts.removeExtensions) {
    // recursively remove nested x- fields
    const removeExtensions = (obj: any) => {
      if (typeof obj !== 'object') return

      for (const key in obj) {
        if (key.startsWith('x-')) {
          delete obj[key]
        } else if (typeof obj[key] === 'object') {
          removeExtensions(obj[key])
        }
      }
    }

    // remove extensions form the whole document
    removeExtensions(output)
  }

  // remove readOnly properties from document
  if (opts.removeReadOnly) {
    // recursively remove readOnly fields
    const removeReadOnly = (obj: any) => {
      if (typeof obj !== 'object') return

      for (const key in obj) {
        if (key === 'readOnly' && typeof obj[key] === 'boolean') {
          delete obj[key]
        } else if (typeof obj[key] === 'object') {
          removeReadOnly(obj[key])
        }
      }
    }

    // remove readOnly from operations
    for (const path in output.paths) {
      if (output.paths[path]) {
        for (const method in output.paths[path]) {
          if (output.paths[path][method]) {
            removeReadOnly(output.paths[path][method])
          }
        }
      }
    }

    // remove readOnly from components
    if (output.components) {
      removeReadOnly(output.components)
    }
  }


  return output
}
