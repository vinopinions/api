module.exports = {
  branches: [
    {
      name: 'master',
    },
    {
      name: 'developer',
    },
  ],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/npm',
    '@semantic-release/github',
    [
      '@codedependant/semantic-release-docker',
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
