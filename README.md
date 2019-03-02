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
- [x] Read local and remote JSON/YAML OpenAPI specification files
- [ ] Use as CLI client to call API operations
- [x] Mock APIs locally with OpenAPI specification
- [x] Run [Swagger UI](https://github.com/swagger-api/swagger-ui) locally
- [x] Run [Swagger Editor](https://github.com/swagger-api/swagger-editor) locally

# Usage
<!-- usage -->
```sh-session
$ npm install -g openapicmd
$ openapi COMMAND
running command...
$ openapi (-v|--version|version)
openapicmd/0.0.13 darwin-x64 node-v10.12.0
$ openapi --help [COMMAND]
USAGE
  $ openapi COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`openapi help [COMMAND]`](#openapi-help-command)
* [`openapi mock`](#openapi-mock)
* [`openapi read`](#openapi-read)
* [`openapi swagger-editor`](#openapi-swagger-editor)
* [`openapi swagger-ui`](#openapi-swagger-ui)

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

## `openapi mock`

start a local mock API server

```
USAGE
  $ openapi mock

OPTIONS
  -U, --swagger-ui=docs           Swagger UI endpoint
  -d, --definition=./openapi.yml  (required) openapi definition file
  -h, --help                      show CLI help
  -p, --port=9000                 [default: 9000] port

EXAMPLES
  $ openapi mock -d ./openapi.yml
  $ openapi mock -d https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v3.0/petstore.yaml
```

_See code: [src/commands/mock.ts](https://github.com/anttiviljami/openapicmd/blob/v0.0.13/src/commands/mock.ts)_

## `openapi read`

read, parse and convert OpenAPI definitions

```
USAGE
  $ openapi read

OPTIONS
  -D, --dereference               resolve $ref pointers
  -V, --validate                  validate against openapi schema
  -d, --definition=./openapi.yml  (required) openapi definition file
  -f, --format=(json|yaml|yml)    [default: yaml] output format
  -h, --help                      show CLI help
  --json                          format as json (short for -f json)
  --yaml                          format as yaml (short for -f yaml)

EXAMPLES
  $ openapi read -d ./openapi.yml -f json > openapi.json
  $ openapi read -d https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v3.0/petstore.yaml
```

_See code: [src/commands/read.ts](https://github.com/anttiviljami/openapicmd/blob/v0.0.13/src/commands/read.ts)_

## `openapi swagger-editor`

start a local Swagger UI instance

```
USAGE
  $ openapi swagger-editor

OPTIONS
  -d, --definition=./openapi.yml  openapi definition file
  -h, --help                      show CLI help
  -p, --port=9000                 [default: 9000] port

EXAMPLES
  $ openapi swagger-editor
  $ openapi swagger-editor -d ./openapi.yml
```

_See code: [src/commands/swagger-editor.ts](https://github.com/anttiviljami/openapicmd/blob/v0.0.13/src/commands/swagger-editor.ts)_

## `openapi swagger-ui`

start a local Swagger UI instance

```
USAGE
  $ openapi swagger-ui

OPTIONS
  -d, --definition=./openapi.yml  openapi definition file
  -h, --help                      show CLI help
  -p, --port=9000                 [default: 9000] port

EXAMPLES
  $ openapi swagger-ui
  $ openapi swagger-ui -d ./openapi.yml
```

_See code: [src/commands/swagger-ui.ts](https://github.com/anttiviljami/openapicmd/blob/v0.0.13/src/commands/swagger-ui.ts)_
<!-- commandsstop -->

## Contributing

OpenAPI Backend is Free and Open Source Software. Issues and pull requests are more than welcome!

[<img alt="The Chilicorn" src="http://spiceprogram.org/assets/img/chilicorn_sticker.svg" width="250" height="250">](https://spiceprogram.org/oss-sponsorship)
