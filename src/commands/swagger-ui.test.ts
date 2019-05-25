import { expect, test } from '@oclif/test';
import * as fs from 'fs';
import * as path from 'path';
import 'chai';

describe('swagger-ui', () => {
  test
    .stdout()
    .command(['swagger-ui', '-d', path.join('examples', 'openapi.yml')])
    .it('runs swagger-ui', (ctx) => {
      expect(ctx.stdout).to.contain('running');
    });

  test
    .stdout()
    .command(['swagger-ui', '-d', path.join('examples', 'openapi.yml'), '--bundle', 'static'])
    .it('bundles swagger-ui', (ctx) => {
      expect(fs.existsSync(path.join('static')));
      expect(fs.existsSync(path.join('static', 'index.html')));
      expect(fs.existsSync(path.join('static', 'openapi.json')));
      expect(fs.existsSync(path.join('static', 'swagger-ui.js')));
    });

  afterEach(() => {
    // emit disconnect to stop the server
    process.emit('disconnect');
  });
});
