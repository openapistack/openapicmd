<h1 align="center">OpenAPI Command Line Tool</h1>

[![CI](https://github.com/anttiviljami/openapicmd/workflows/CI/badge.svg)](https://github.com/anttiviljami/openapicmd/actions?query=workflow%3ACI)
[![npm version](https://img.shields.io/npm/v/openapicmd.svg)](https://www.npmjs.com/package/openapicmd)
[![License](http://img.shields.io/:license-mit-blue.svg)](https://github.com/anttiviljami/openapicmd/blob/master/LICENSE)
[![Sponsored](https://img.shields.io/badge/chilicorn-sponsored-brightgreen.svg?logo=data%3Aimage%2Fpng%3Bbase64%2CiVBORw0KGgoAAAANSUhEUgAAAA4AAAAPCAMAAADjyg5GAAABqlBMVEUAAAAzmTM3pEn%2FSTGhVSY4ZD43STdOXk5lSGAyhz41iz8xkz2HUCWFFhTFFRUzZDvbIB00Zzoyfj9zlHY0ZzmMfY0ydT0zjj92l3qjeR3dNSkoZp4ykEAzjT8ylUBlgj0yiT0ymECkwKjWqAyjuqcghpUykD%2BUQCKoQyAHb%2BgylkAyl0EynkEzmkA0mUA3mj86oUg7oUo8n0k%2FS%2Bw%2Fo0xBnE5BpU9Br0ZKo1ZLmFZOjEhesGljuzllqW50tH14aS14qm17mX9%2Bx4GAgUCEx02JySqOvpSXvI%2BYvp2orqmpzeGrQh%2Bsr6yssa2ttK6v0bKxMBy01bm4zLu5yry7yb29x77BzMPCxsLEzMXFxsXGx8fI3PLJ08vKysrKy8rL2s3MzczOH8LR0dHW19bX19fZ2dna2trc3Nzd3d3d3t3f39%2FgtZTg4ODi4uLj4%2BPlGxLl5eXm5ubnRzPn5%2Bfo6Ojp6enqfmzq6urr6%2Bvt7e3t7u3uDwvugwbu7u7v6Obv8fDz8%2FP09PT2igP29vb4%2BPj6y376%2Bu%2F7%2Bfv9%2Ff39%2Fv3%2BkAH%2FAwf%2FtwD%2F9wCyh1KfAAAAKXRSTlMABQ4VGykqLjVCTVNgdXuHj5Kaq62vt77ExNPX2%2Bju8vX6%2Bvr7%2FP7%2B%2FiiUMfUAAADTSURBVAjXBcFRTsIwHAfgX%2FtvOyjdYDUsRkFjTIwkPvjiOTyX9%2FAIJt7BF570BopEdHOOstHS%2BX0s439RGwnfuB5gSFOZAgDqjQOBivtGkCc7j%2B2e8XNzefWSu%2BsZUD1QfoTq0y6mZsUSvIkRoGYnHu6Yc63pDCjiSNE2kYLdCUAWVmK4zsxzO%2BQQFxNs5b479NHXopkbWX9U3PAwWAVSY%2FpZf1udQ7rfUpQ1CzurDPpwo16Ff2cMWjuFHX9qCV0Y0Ok4Jvh63IABUNnktl%2B6sgP%2BARIxSrT%2FMhLlAAAAAElFTkSuQmCC)](http://spiceprogram.org/oss-sponsorship)
[![Buy me a coffee](https://img.shields.io/badge/donate-buy%20me%20a%20coffee-orange)](https://buymeacoff.ee/anttiviljami)

<p align="center">openapicmd - The CLI for all things OpenAPI and Swagger</p>

# Install

```
npm install -g openapicmd
openapi help
```

# Features
- [x] Read and convert local and remote JSON/YAML OpenAPI definition files
- [x] Use as CLI client to easily call API endpoints
- [x] Run [Swagger UI](https://github.com/swagger-api/swagger-ui) locally
- [x] Bundle static [Swagger UI](https://github.com/swagger-api/swagger-ui) sites
- [x] Run [Swagger Editor](https://github.com/swagger-api/swagger-editor) locally
- [x] Convert Swagger 2.0 to OpenAPI 3.0.x
- [x] Run Local Mock APIs

# Commands
<!-- commands -->
<<<<<<< HEAD
* [`openapi auth [DEFINITION]`](#openapi-auth-definition)
* [`openapi call [DEFINITION]`](#openapi-call-definition)
* [`openapi help [COMMAND]`](#openapi-help-command)
* [`openapi info [DEFINITION]`](#openapi-info-definition)
=======
* [`openapi help`](#openapi-help)
* [`openapi read`](#openapi-read)
* [`openapi info`](#openapi-info)
* [`openapi swagger-ui`](#openapi-swagger-ui)
* [`openapi swagger-editor`](#openapi-swagger-editor)
* [`openapi call`](#openapi-call)
* [`openapi mock`](#openapi-mock)
* [`openapi swagger2openapi`](#openapi-swagger2openapi)
>>>>>>> d9a682c (Upgrade to latest swagger-ui-dist)
* [`openapi init`](#openapi-init)
* [`openapi load`](#openapi-load)
* [`openapi unload`](#openapi-unload)

<<<<<<< HEAD
## `openapi auth [DEFINITION]`

Authenticate with apis (writes to .openapiconfig)

```
Authenticate with apis (writes to .openapiconfig)

USAGE
  $ openapi auth [DEFINITION]

ARGUMENTS
  DEFINITION  input definition file

OPTIONS
  -B, --bundle                               resolve remote $ref pointers
  -D, --dereference                          resolve $ref pointers
  -H, --header=header                        add request headers when calling remote urls
  -I, --inject={"info":{"version":"1.0.0"}}  inject JSON to definition with deep merge
  -R, --root=/                               override API root path
  -S, --server=http://localhost:9000         override servers definition
  -V, --validate                             validate against openapi schema
  -h, --help                                 show CLI help
  -k, --apikey=apikey                        set api key
  -p, --password=password                    set basic auth password
  -s, --security=security                    use security scheme
  -t, --token=token                          set bearer token
  -u, --username=username                    set basic auth username

EXAMPLES
  $ openapi auth
  $ openapi auth --token eyJh...
  $ openapi auth --security ApiKeyAuth --apikey secret123
  $ openapi auth --security BasicAuth --username admin --password password
```

_See code: [src/commands/auth.ts](https://github.com/anttiviljami/openapicmd/blob/v1.13.4/src/commands/auth.ts)_

## `openapi call [DEFINITION]`
=======
## `openapi help`
>>>>>>> d9a682c (Upgrade to latest swagger-ui-dist)

display help for openapi

```
USAGE
  $ openapi help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

## `openapi read`

Read and manipulate definition files

```
USAGE
  $ openapi read [DEFINITION]

ARGUMENTS
  DEFINITION  input definition file

OPTIONS
  -B, --bundle                               resolve remote $ref pointers
  -D, --dereference                          resolve $ref pointers
  -H, --header=header                        add request headers when calling remote urls
  -I, --inject={"info":{"version":"1.0.0"}}  inject JSON to definition with deep merge
  -R, --root=/                               override API root path
  -S, --server=http://localhost:9000         override servers definition
  -V, --validate                             validate against openapi schema
  -f, --format=(json|yaml|yml)               [default: yaml] output format
  -h, --help                                 show CLI help
<<<<<<< HEAD
  -i, --include                              include status code and response headers the output
  -k, --apikey=apikey                        set api key
  -o, --operation=operationId                operationId
  -p, --param=key=value                      parameter
  -p, --password=password                    set basic auth password
  -s, --security=security                    use security scheme
  -t, --token=token                          set bearer token
  -u, --username=username                    set basic auth username
  -v, --verbose                              verbose mode

EXAMPLES
  $ openapi call -o getPets
  $ openapi call -o getPet -p id=1
  $ openapi call -o createPet -d '{ "name": "Garfield" }'
```

_See code: [src/commands/call.ts](https://github.com/anttiviljami/openapicmd/blob/v1.13.4/src/commands/call.ts)_

## `openapi help [COMMAND]`

display help for openapi

```
display help for <%= config.bin %>

USAGE
  $ openapi help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
=======
  --json                                     format as json (short for -f json)
  --yaml                                     format as yaml (short for -f yaml)

EXAMPLES
  $ openapi read https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v3.0/petstore.yaml
  $ openapi read ./openapi.yml -f json > openapi.json
>>>>>>> d9a682c (Upgrade to latest swagger-ui-dist)
```

## `openapi info`

Display API information

```
USAGE
  $ openapi info [DEFINITION]

ARGUMENTS
  DEFINITION  input definition file

OPTIONS
  -B, --bundle                               resolve remote $ref pointers
  -D, --dereference                          resolve $ref pointers
  -H, --header=header                        add request headers when calling remote urls
  -I, --inject={"info":{"version":"1.0.0"}}  inject JSON to definition with deep merge
  -R, --root=/                               override API root path
  -S, --server=http://localhost:9000         override servers definition
  -V, --validate                             validate against openapi schema
  -h, --help                                 show CLI help
  --operations                               list operations in document
  --schemas                                  list schemas in document
  --security                                 list security schemes in document

EXAMPLES
  $ openapi info https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v3.0/petstore.yaml
  $ openapi info ./openapi.yml
```

<<<<<<< HEAD
_See code: [src/commands/info.ts](https://github.com/anttiviljami/openapicmd/blob/v1.13.4/src/commands/info.ts)_
=======
## `openapi swagger-ui`
>>>>>>> d9a682c (Upgrade to latest swagger-ui-dist)

Start or bundle a Swagger UI instance

```
USAGE
  $ openapi swagger-ui [DEFINITION]

ARGUMENTS
  DEFINITION  input definition file

OPTIONS
  -B, --bundle=outDir                        bundle a static site to directory
  -H, --header=header                        add request headers when calling remote urls
  -I, --inject={"info":{"version":"1.0.0"}}  inject JSON to definition with deep merge
  -R, --root=/                               override API root path
  -S, --server=http://localhost:9000         override servers definition
  -h, --help                                 show CLI help
  -p, --port=9000                            [default: 9000] port
  --[no-]deeplinks                           [default: true] allow deep linking
  --expand=full|list|none                    [default: list] default expansion setting for the operations and tags
  --[no-]filter                              [default: true] enable filtering by tag
  --[no-]logger                              [default: true] log requests
  --[no-]operationids                        [default: true] display operationIds
  --proxy                                    set up a proxy for the api to avoid CORS issues
  --[no-]requestduration                     [default: true] display request durations in "try it now"
  --[no-]withcredentials                     [default: true] send cookies in "try it now"

EXAMPLES
  $ openapi swagger-ui
  $ openapi swagger-ui ./openapi.yml
  $ openapi swagger-ui ./openapi.yml --bundle outDir
```

<<<<<<< HEAD
_See code: [src/commands/init.ts](https://github.com/anttiviljami/openapicmd/blob/v1.13.4/src/commands/init.ts)_

## `openapi load DEFINITION`
=======
## `openapi swagger-editor`
>>>>>>> d9a682c (Upgrade to latest swagger-ui-dist)

Start a Swagger Editor instance

```
USAGE
  $ openapi swagger-editor [DEFINITION]

ARGUMENTS
  DEFINITION  input definition file

OPTIONS
  -H, --header=header  add request headers when calling remote urls
  -h, --help           show CLI help
  -p, --port=9000      [default: 9000] port
  --[no-]logger        [default: true] log requests

EXAMPLES
  $ openapi swagger-editor
  $ openapi swagger-editor ./openapi.yml
```

<<<<<<< HEAD
_See code: [src/commands/load.ts](https://github.com/anttiviljami/openapicmd/blob/v1.13.4/src/commands/load.ts)_
=======
## `openapi call`
>>>>>>> d9a682c (Upgrade to latest swagger-ui-dist)

Call API endpoints

```
USAGE
  $ openapi call [DEFINITION]

ARGUMENTS
  DEFINITION  input definition file

OPTIONS
  -B, --bundle                               resolve remote $ref pointers
  -D, --dereference                          resolve $ref pointers
  -H, --header=header                        add request headers when calling remote urls
  -I, --inject={"info":{"version":"1.0.0"}}  inject JSON to definition with deep merge
  -R, --root=/                               override API root path
  -S, --server=http://localhost:9000         override servers definition
  -V, --validate                             validate against openapi schema
  -d, --data=data                            request body
  -h, --help                                 show CLI help
  -i, --include                              include status code and response headers the output
  -o, --operation=operationId                operationId
  -p, --param=key=value                      parameter

EXAMPLES
  $ openapi call -o getPets
  $ openapi call -o getPet -p id=1
  $ openapi call -o createPet -d '{ "name": "Garfield" }'
```

## `openapi mock`

Start a local mock API server

```
USAGE
  $ openapi mock [DEFINITION]

ARGUMENTS
  DEFINITION  input definition file

OPTIONS
  -H, --header=header                        add request headers when calling remote urls
  -I, --inject={"info":{"version":"1.0.0"}}  inject JSON to definition with deep merge
  -R, --root=/                               override API root path
  -S, --server=http://localhost:9000         override servers definition
  -U, --swagger-ui=docs                      Swagger UI endpoint
  -h, --help                                 show CLI help
  -p, --port=9000                            [default: 9000] port
  --[no-]logger                              [default: true] log requests
  --[no-]validate                            [default: true] validate requests according to schema

EXAMPLES
  $ openapi mock ./openapi.yml
  $ openapi mock https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v3.0/petstore.yaml
```

<<<<<<< HEAD
_See code: [src/commands/mock.ts](https://github.com/anttiviljami/openapicmd/blob/v1.13.4/src/commands/mock.ts)_
=======
## `openapi swagger2openapi`
>>>>>>> d9a682c (Upgrade to latest swagger-ui-dist)

Convert Swagger 2.0 definitions to OpenAPI 3.0.x

```
USAGE
  $ openapi swagger2openapi [DEFINITION]

ARGUMENTS
  DEFINITION  input definition file

OPTIONS
  -B, --bundle                               resolve remote $ref pointers
  -D, --dereference                          resolve $ref pointers
  -H, --header=header                        add request headers when calling remote urls
  -I, --inject={"info":{"version":"1.0.0"}}  inject JSON to definition with deep merge
  -R, --root=/                               override API root path
  -S, --server=http://localhost:9000         override servers definition
  -V, --validate                             validate against openapi schema
  -f, --format=(json|yaml|yml)               [default: yaml] output format
  -h, --help                                 show CLI help
  --json                                     format as json (short for -f json)
  --yaml                                     format as yaml (short for -f yaml)

<<<<<<< HEAD
EXAMPLES
  $ openapi read https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v3.0/petstore.yaml
  $ openapi read ./openapi.yml -f json > openapi.json
```

_See code: [src/commands/read.ts](https://github.com/anttiviljami/openapicmd/blob/v1.13.4/src/commands/read.ts)_

## `openapi swagger-editor [DEFINITION]`

Start a Swagger Editor instance

```
Start a Swagger Editor instance

USAGE
  $ openapi swagger-editor [DEFINITION]

ARGUMENTS
  DEFINITION  input definition file

OPTIONS
  -H, --header=header  add request headers when calling remote urls
  -h, --help           show CLI help
  -p, --port=9000      [default: 9000] port
  --[no-]logger        [default: true] log requests

EXAMPLES
  $ openapi swagger-editor
  $ openapi swagger-editor ./openapi.yml
```

_See code: [src/commands/swagger-editor.ts](https://github.com/anttiviljami/openapicmd/blob/v1.13.4/src/commands/swagger-editor.ts)_

## `openapi swagger-ui [DEFINITION]`
=======
EXAMPLE
  $ openapi swagger2openapi --yaml ./swagger.json > openapi.yml
```

## `openapi init`
>>>>>>> d9a682c (Upgrade to latest swagger-ui-dist)

Initialise a definition file from scratch

```
USAGE
  $ openapi init

OPTIONS
  -I, --inject={"info":{"version":"1.0.0"}}  inject JSON to definition with deep merge
  -S, --server=http://localhost:9000         override servers definition
  -T, --title=title                          [default: My API] The title for the API
  -d, --description=description              Description for the API
  -f, --format=(json|yaml|yml)               [default: yaml] output format
  -h, --help                                 show CLI help
  -v, --version=version                      [default: 0.0.1] Version of the API
  --json                                     format as json (short for -f json)
  --license=mit|apache2                      The license for the API
  --terms=terms                              A URL to the Terms of Service for the API.
  --yaml                                     format as yaml (short for -f yaml)

EXAMPLE
  $ openapi init --title 'My API' > openapi.yml
```

<<<<<<< HEAD
_See code: [src/commands/swagger-ui.ts](https://github.com/anttiviljami/openapicmd/blob/v1.13.4/src/commands/swagger-ui.ts)_
=======
## `openapi load`
>>>>>>> d9a682c (Upgrade to latest swagger-ui-dist)

Set the default definition file for a workspace (writes to .openapiconfig)

```
USAGE
  $ openapi load DEFINITION

ARGUMENTS
  DEFINITION  input definition file

OPTIONS
  -V, --validate  validate against openapi schema
  -h, --help      show CLI help

EXAMPLES
  $ openapi load ./openapi.yml
  $ openapi load https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v3.0/petstore.yaml
```

<<<<<<< HEAD
_See code: [src/commands/swagger2openapi.ts](https://github.com/anttiviljami/openapicmd/blob/v1.13.4/src/commands/swagger2openapi.ts)_

=======
>>>>>>> d9a682c (Upgrade to latest swagger-ui-dist)
## `openapi unload`

Unset the default definition file for a workspace (writes to .openapiconfig)

```
USAGE
  $ openapi unload

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ openapi unload
```
<<<<<<< HEAD

_See code: [src/commands/unload.ts](https://github.com/anttiviljami/openapicmd/blob/v1.13.4/src/commands/unload.ts)_
=======
>>>>>>> d9a682c (Upgrade to latest swagger-ui-dist)
<!-- commandsstop -->

## Contributing

OpenAPI Backend is Free and Open Source Software. Issues and pull requests are more than welcome!

[<img alt="The Chilicorn" src="http://spiceprogram.org/assets/img/chilicorn_sticker.svg" width="250" height="250">](https://spiceprogram.org/oss-sponsorship)
