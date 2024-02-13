const plugins = [
  '@semantic-release/commit-analyzer',
  '@semantic-release/release-notes-generator',
  [
    '@semantic-release/npm',
    {
      npmPublish: false,
    },
  ],
  '@semantic-release/git',
];

// only create github release on master branch
if (process.env.BRANCH_NAME == 'master') {
  plugins.push([
    '@semantic-release/github',
    {
      addReleases: 'bottom',
    },
  ]);
}

export default {
  branches: [
    {
      name: 'master',
    },
    {
      name: 'developer',
      prerelease: 'dev',
    },
  ],
  plugins,
};
