module.exports = {
  branches: [
    {
      name: 'master',
    },
    {
      name: 'developer',
      prerelease: 'dev',
    },
  ],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@codedependant/semantic-release-docker',
    // only create github release on master branch
    process.env.BRANCH_NAME == 'master' ?? [
      '@semantic-release/github',
      {
        addReleases: 'bottom',
      },
    ],
    [
      {
        dockerRegistry: process.env.DOCKER_REGISTRY,
        dockerTags: [process.env.DOCKER_IMAGE_TAG, '{{version}}'],
        dockerImage: process.env.DOCKER_IMAGE_NAME,
        dockerProject: process.env.DOCKER_PROJECT,
        dockerFile: 'Dockerfile',
      },
    ],
    '@semantic-release/git',
  ],
};
