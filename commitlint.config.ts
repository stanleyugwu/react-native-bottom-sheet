import type { UserConfig } from '@commitlint/types';

const Configuration: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      headerPattern:
        /^(?<type>.*\s\w*)(?:\((?<scope>.*)\))?!?:\s(?<subject>(?:(?!#).)*(?:(?!\s).))$/,
      headerCorrespondence: ['type', 'scope', 'subject'],
    },
  },
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
        '🛠️ build',
        '🛠️🚀 build', // new version release
        '♻️ chore',
        '⚙️ ci',
        '📃 docs',
        '✨ feat',
        '🐞 fix',
        '🚀 perf',
        '🦄 refactor',
        '🗑️ revert',
        '🌈 style',
        '🧪 test',
      ],
    ],
  },
};

module.exports = Configuration;
