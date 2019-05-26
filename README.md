OpenAPICMD
==========
[![Build Status](https://travis-ci.org/anttiviljami/openapicmd.svg?branch=master)](https://travis-ci.org/anttiviljami/openapicmd)
[![Dependencies](https://david-dm.org/anttiviljami/openapicmd.svg)](https://david-dm.org/anttiviljami/openapicmd)
[![npm version](https://img.shields.io/npm/v/openapicmd.svg)](https://www.npmjs.com/package/openapicmd)
[![License](http://img.shields.io/:license-mit-blue.svg)](https://github.com/anttiviljami/openapicmd/blob/master/LICENSE)
[![Sponsored](https://img.shields.io/badge/chilicorn-sponsored-brightgreen.svg?logo=data%3Aimage%2Fpng%3Bbase64%2CiVBORw0KGgoAAAANSUhEUgAAAA4AAAAPCAMAAADjyg5GAAABqlBMVEUAAAAzmTM3pEn%2FSTGhVSY4ZD43STdOXk5lSGAyhz41iz8xkz2HUCWFFhTFFRUzZDvbIB00Zzoyfj9zlHY0ZzmMfY0ydT0zjj92l3qjeR3dNSkoZp4ykEAzjT8ylUBlgj0yiT0ymECkwKjWqAyjuqcghpUykD%2BUQCKoQyAHb%2BgylkAyl0EynkEzmkA0mUA3mj86oUg7oUo8n0k%2FS%2Bw%2Fo0xBnE5BpU9Br0ZKo1ZLmFZOjEhesGljuzllqW50tH14aS14qm17mX9%2Bx4GAgUCEx02JySqOvpSXvI%2BYvp2orqmpzeGrQh%2Bsr6yssa2ttK6v0bKxMBy01bm4zLu5yry7yb29x77BzMPCxsLEzMXFxsXGx8fI3PLJ08vKysrKy8rL2s3MzczOH8LR0dHW19bX19fZ2dna2trc3Nzd3d3d3t3f39%2FgtZTg4ODi4uLj4%2BPlGxLl5eXm5ubnRzPn5%2Bfo6Ojp6enqfmzq6urr6%2Bvt7e3t7u3uDwvugwbu7u7v6Obv8fDz8%2FP09PT2igP29vb4%2BPj6y376%2Bu%2F7%2Bfv9%2Ff39%2Fv3%2BkAH%2FAwf%2FtwD%2F9wCyh1KfAAAAKXRSTlMABQ4VGykqLjVCTVNgdXuHj5Kaq62vt77ExNPX2%2Bju8vX6%2Bvr7%2FP7%2B%2FiiUMfUAAADTSURBVAjXBcFRTsIwHAfgX%2FtvOyjdYDUsRkFjTIwkPvjiOTyX9%2FAIJt7BF570BopEdHOOstHS%2BX0s439RGwnfuB5gSFOZAgDqjQOBivtGkCc7j%2B2e8XNzefWSu%2BsZUD1QfoTq0y6mZsUSvIkRoGYnHu6Yc63pDCjiSNE2kYLdCUAWVmK4zsxzO%2BQQFxNs5b479NHXopkbWX9U3PAwWAVSY%2FpZf1udQ7rfUpQ1CzurDPpwo16Ff2cMWjuFHX9qCV0Y0Ok4Jvh63IABUNnktl%2B6sgP%2BARIxSrT%2FMhLlAAAAAElFTkSuQmCC)](http://spiceprogram.org/oss-sponsorship)

Command line tools for openapi-enabled APIs

<!-- toc -->
* [Features](#features)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Features
- [x] Read and convert local and remote JSON/YAML OpenAPI definition files
- [x] Run [Swagger UI](https://github.com/swagger-api/swagger-ui) locally
- [x] Bundle static [Swagger UI](https://github.com/swagger-api/swagger-ui) sites
- [x] Run [Swagger Editor](https://github.com/swagger-api/swagger-editor) locally
- [x] Convert Swagger 2.0 to OpenAPI 3.0.x
- [x] Run Mock APIs
- [ ] Use as CLI client to call API operations

# Usage
<!-- usage -->
```sh-session
$ npm install -g openapicmd
$ openapi COMMAND
running command...
$ openapi (-v|--version|version)
openapicmd/0.1.3 darwin-x64 node-v10.12.0
$ openapi --help [COMMAND]
USAGE
  $ openapi COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`openapi help [COMMAND]`](#openapi-help-command)
* [`openapi init`](#openapi-init)
* [`openapi mock DEFINITION`](#openapi-mock-definition)
* [`openapi read DEFINITION`](#openapi-read-definition)
* [`openapi swagger-editor [DEFINITION]`](#openapi-swagger-editor-definition)
* [`openapi swagger-ui [DEFINITION]`](#openapi-swagger-ui-definition)
* [`openapi swagger2openapi DEFINITION`](#openapi-swagger2openapi-definition)

## `openapi help [COMMAND]`

display help for openapi

```
USAGE
  $ openapi help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.1.6/src/commands/help.ts)_

## `openapi init`

initialise an OpenAPI definition file

```
USAGE
  $ openapi init

OPTIONS
  -S, --server=http://localhost:9000  add servers to definition
  -T, --title=title                   [default: My API] The title for the API
  -d, --description=description       Description for the API
  -f, --format=(json|yaml|yml)        [default: yaml] output format
  -h, --help                          show CLI help
  -v, --version=version               [default: 0.0.1] Version of the API
  --json                              format as json (short for -f json)
  --license=mit|apache2               The license for the API
  --terms=terms                       A URL to the Terms of Service for the API.
  --yaml                              format as yaml (short for -f yaml)

EXAMPLE
  $ openapi init --title 'My API' > openapi.yml
```

_See code: [src/commands/init.ts](https://github.com/anttiviljami/openapicmd/blob/v0.1.3/src/commands/init.ts)_

## `openapi mock DEFINITION`

start a local mock API server

```
USAGE
  $ openapi mock DEFINITION

ARGUMENTS
  DEFINITION  input definition file

OPTIONS
  -U, --swagger-ui=docs  Swagger UI endpoint
  -h, --help             show CLI help
  -p, --port=9000        [default: 9000] port

EXAMPLES
  $ openapi mock ./openapi.yml
  $ openapi mock https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v3.0/petstore.yaml
```

_See code: [src/commands/mock.ts](https://github.com/anttiviljami/openapicmd/blob/v0.1.3/src/commands/mock.ts)_

## `openapi read DEFINITION`

read, parse and convert OpenAPI definitions

```
USAGE
  $ openapi read DEFINITION

ARGUMENTS
  DEFINITION  input definition file

OPTIONS
  -D, --dereference                   resolve $ref pointers
  -S, --server=http://localhost:9000  add servers to definition
  -V, --validate                      validate against openapi schema
  -f, --format=(json|yaml|yml)        [default: yaml] output format
  -h, --help                          show CLI help
  --json                              format as json (short for -f json)
  --yaml                              format as yaml (short for -f yaml)

EXAMPLES
  $ openapi read https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v3.0/petstore.yaml
  $ openapi read ./openapi.yml -f json > openapi.json
```

_See code: [src/commands/read.ts](https://github.com/anttiviljami/openapicmd/blob/v0.1.3/src/commands/read.ts)_

## `openapi swagger-editor [DEFINITION]`

serve a local Swagger UI instance

```
USAGE
  $ openapi swagger-editor [DEFINITION]

ARGUMENTS
  DEFINITION  input definition file

OPTIONS
  -h, --help       show CLI help
  -p, --port=9000  [default: 9000] port

EXAMPLES
  $ openapi swagger-editor
  $ openapi swagger-editor ./openapi.yml
  $ openapi swagger-editor ./openapi.yml --bundle static
```

_See code: [src/commands/swagger-editor.ts](https://github.com/anttiviljami/openapicmd/blob/v0.1.3/src/commands/swagger-editor.ts)_

## `openapi swagger-ui [DEFINITION]`

serve or bundle a Swagger UI instance

```
USAGE
  $ openapi swagger-ui [DEFINITION]

ARGUMENTS
  DEFINITION  input definition file

OPTIONS
  -B, --bundle=outDir                 bundle a static site to directory
  -S, --server=http://localhost:9000  add servers to definition
  -h, --help                          show CLI help
  -p, --port=9000                     [default: 9000] port
  --[no-]deeplinks                    [default: true] allow deep linking
  --expand=full|list|none             [default: list] default expansion setting for the operations and tags
  --[no-]filter                       [default: true] enable filtering by tag
  --[no-]operationids                 [default: true] display operationIds
  --proxy                             set up a proxy for the api to avoid CORS issues
  --[no-]requestduration              [default: true] display request durations in "try it now"
  --[no-]withcredentials              [default: true] send cookies in "try it now"

EXAMPLES
  $ openapi swagger-ui
  $ openapi swagger-ui ./openapi.yml
```

_See code: [src/commands/swagger-ui.ts](https://github.com/anttiviljami/openapicmd/blob/v0.1.3/src/commands/swagger-ui.ts)_

## `openapi swagger2openapi DEFINITION`

convert Swagger 2.0 definitions to OpenAPI 3.0.x

```
USAGE
  $ openapi swagger2openapi DEFINITION

ARGUMENTS
  DEFINITION  input definition file

OPTIONS
  -D, --dereference                   resolve $ref pointers
  -S, --server=http://localhost:9000  add servers to definition
  -V, --validate                      validate against openapi schema
  -f, --format=(json|yaml|yml)        [default: yaml] output format
  -h, --help                          show CLI help
  --json                              format as json (short for -f json)
  --yaml                              format as yaml (short for -f yaml)

EXAMPLE
  $ openapi swagger2openapi --yaml ./swagger.json > openapi.yml
```

_See code: [src/commands/swagger2openapi.ts](https://github.com/anttiviljami/openapicmd/blob/v0.1.3/src/commands/swagger2openapi.ts)_
<!-- commandsstop -->

## Contributing

OpenAPI Backend is Free and Open Source Software. Issues and pull requests are more than welcome!

[<img alt="The Chilicorn" src="http://spiceprogram.org/assets/img/chilicorn_sticker.svg" width="250" height="250">](https://spiceprogram.org/oss-sponsorship)
