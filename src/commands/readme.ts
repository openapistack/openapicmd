import { Command, flags } from '@oclif/command';
import * as Config from '@oclif/config';
import Help from '@oclif/plugin-help';
import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';

import { castArray, compact, sortBy, template, uniqBy } from '@oclif/dev-cli/lib/util';

const columns = parseInt(process.env.COLUMNS!, 10) || 120;
const slugify = new (require('github-slugger') as any)();

// tslint:disable no-empty
export default class Readme extends Command {
  static hidden = true;

  async run() {
    const config = await Config.load({ root: process.cwd(), devPlugins: false, userPlugins: false });
    try {
      const p = require.resolve('@oclif/plugin-legacy', { paths: [process.cwd()] });
      const plugin = new Config.Plugin({ root: p, type: 'core' });
      await plugin.load();
      config.plugins.push(plugin);
    } catch {}
    await config.runHook('init', { id: 'readme', argv: this.argv });
    let readme = await fs.readFile('README.md', 'utf8');
    let commands = config.commands;
    commands = commands.filter((c) => !c.hidden);
    commands = commands.filter((c) => c.pluginType === 'core');
    this.debug('commands:', commands.map((c) => c.id).length);
    commands = sortBy(commands, (c) => c.id);
    commands = [
      _.find(commands, { id: 'help' }),
      _.find(commands, { id: 'read' }),
      _.find(commands, { id: 'info' }),
      _.find(commands, { id: 'swagger-ui' }),
      _.find(commands, { id: 'swagger-editor' }),
      _.find(commands, { id: 'call' }),
      _.find(commands, { id: 'mock' }),
      _.find(commands, { id: 'swagger2openapi' }),
      _.find(commands, { id: 'init' }),
      _.find(commands, { id: 'load' }),
      _.find(commands, { id: 'unload' }),
      ...commands,
    ];
    commands = _.uniqBy(commands, (c) => c.id);
    readme = this.replaceTag(readme, 'commands', this.commands(config, commands));

    readme = readme.trimRight();
    readme += '\n';
    await fs.outputFile('README.md', readme);
  }

  replaceTag(readme: string, tag: string, body: string): string {
    if (readme.includes(`<!-- ${tag} -->`)) {
      if (readme.includes(`<!-- ${tag}stop -->`)) {
        readme = readme.replace(new RegExp(`<!-- ${tag} -->(.|\n)*<!-- ${tag}stop -->`, 'm'), `<!-- ${tag} -->`);
      }
      this.log(`replacing <!-- ${tag} --> in README.md`);
    }
    return readme.replace(`<!-- ${tag} -->`, `<!-- ${tag} -->\n${body}\n<!-- ${tag}stop -->`);
  }

  commands(config: Config.IConfig, commands: Config.Command[]): string {
    return [
      ...commands.map((c) => {
        const usage = this.commandUsage(config, c);
        return `* [\`${config.bin} ${usage}\`](#${slugify.slug(`${config.bin}-${usage}`)})`;
      }),
      '',
      ...commands.map((c) => this.renderCommand(config, c)).map((s) => s.trim() + '\n'),
    ]
      .join('\n')
      .trim();
  }

  renderCommand(config: Config.IConfig, c: Config.Command): string {
    this.debug('rendering command', c.id);
    const title = template({ config, command: c })(c.description || '')
      .trim()
      .split('\n')[0];
    const help = new Help(config, { stripAnsi: true, maxWidth: columns });
    const header = () => `## \`${config.bin} ${this.commandUsage(config, c)}\``;
    return compact([header(), title, '```\n' + help.command(c).trim() + '\n```']).join('\n\n');
  }

  private commandUsage(config: Config.IConfig, command: Config.Command): string {
    const defaultUsage = () => {
      return compact([command.id]).join(' ');
    };
    const usages = castArray(command.usage);
    return template({ config, command })(usages.length === 0 ? defaultUsage() : usages[0]);
  }
}
