OpenAPICMD
==========
[![Build Status](https://travis-ci.org/anttiviljami/openapicmd.svg?branch=master)](https://travis-ci.org/anttiviljami/openapicmd)
[![License](http://img.shields.io/:license-mit-blue.svg)](https://github.com/anttiviljami/openapicmd/blob/master/LICENSE)
[![Sponsored](https://img.shields.io/badge/chilicorn-sponsored-brightgreen.svg?logo=data%3Aimage%2Fpng%3Bbase64%2CiVBORw0KGgoAAAANSUhEUgAAAA4AAAAPCAMAAADjyg5GAAABqlBMVEUAAAAzmTM3pEn%2FSTGhVSY4ZD43STdOXk5lSGAyhz41iz8xkz2HUCWFFhTFFRUzZDvbIB00Zzoyfj9zlHY0ZzmMfY0ydT0zjj92l3qjeR3dNSkoZp4ykEAzjT8ylUBlgj0yiT0ymECkwKjWqAyjuqcghpUykD%2BUQCKoQyAHb%2BgylkAyl0EynkEzmkA0mUA3mj86oUg7oUo8n0k%2FS%2Bw%2Fo0xBnE5BpU9Br0ZKo1ZLmFZOjEhesGljuzllqW50tH14aS14qm17mX9%2Bx4GAgUCEx02JySqOvpSXvI%2BYvp2orqmpzeGrQh%2Bsr6yssa2ttK6v0bKxMBy01bm4zLu5yry7yb29x77BzMPCxsLEzMXFxsXGx8fI3PLJ08vKysrKy8rL2s3MzczOH8LR0dHW19bX19fZ2dna2trc3Nzd3d3d3t3f39%2FgtZTg4ODi4uLj4%2BPlGxLl5eXm5ubnRzPn5%2Bfo6Ojp6enqfmzq6urr6%2Bvt7e3t7u3uDwvugwbu7u7v6Obv8fDz8%2FP09PT2igP29vb4%2BPj6y376%2Bu%2F7%2Bfv9%2Ff39%2Fv3%2BkAH%2FAwf%2FtwD%2F9wCyh1KfAAAAKXRSTlMABQ4VGykqLjVCTVNgdXuHj5Kaq62vt77ExNPX2%2Bju8vX6%2Bvr7%2FP7%2B%2FiiUMfUAAADTSURBVAjXBcFRTsIwHAfgX%2FtvOyjdYDUsRkFjTIwkPvjiOTyX9%2FAIJt7BF570BopEdHOOstHS%2BX0s439RGwnfuB5gSFOZAgDqjQOBivtGkCc7j%2B2e8XNzefWSu%2BsZUD1QfoTq0y6mZsUSvIkRoGYnHu6Yc63pDCjiSNE2kYLdCUAWVmK4zsxzO%2BQQFxNs5b479NHXopkbWX9U3PAwWAVSY%2FpZf1udQ7rfUpQ1CzurDPpwo16Ff2cMWjuFHX9qCV0Y0Ok4Jvh63IABUNnktl%2B6sgP%2BARIxSrT%2FMhLlAAAAAElFTkSuQmCC)](http://spiceprogram.org/oss-sponsorship)

Command line tools for openapi-enabled APIs

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Features
- [ ] Read local and remote JSON/YAML OpenAPI specification files
- [ ] Use as CLI client to call API operations
- [ ] Mock APIs locally with OpenAPI specification
- [ ] Run Swagger UI web interface

# Usage
<!-- usage -->
```sh-session
$ npm install -g openapicmd
$ openapi COMMAND
running command...
$ openapi (-v|--version|version)
openapicmd/0.0.1 darwin-x64 node-v10.12.0
$ openapi --help [COMMAND]
USAGE
  $ openapi COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`openapi hello [FILE]`](#openapi-hello-file)
* [`openapi help [COMMAND]`](#openapi-help-command)

## `openapi hello [FILE]`

describe the command here

```
USAGE
  $ openapi hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ openapi hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/anttiviljami/openapicmd/blob/v0.0.1/src/commands/hello.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.1.4/src/commands/help.ts)_
<!-- commandsstop -->
* [`mynewcli hello [FILE]`](#mynewcli-hello-file)
* [`mynewcli help [COMMAND]`](#mynewcli-help-command)

## `mynewcli hello [FILE]`

describe the command here

```
USAGE
  $ mynewcli hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ mynewcli hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/anttiviljami/mynewcli/blob/v0.0.0/src/commands/hello.ts)_

## `mynewcli help [COMMAND]`

display help for mynewcli

```
USAGE
  $ mynewcli help [COMMAND]
