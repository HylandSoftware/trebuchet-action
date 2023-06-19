import {
  ECR,
  DescribeRepositoriesCommand,
  CreateRepositoryCommand,
  RepositoryNotFoundException,
} from '@aws-sdk/client-ecr';
import * as core from '@actions/core';
import * as docker from './docker';
import * as ecrHelper from './ecr';
export class Push {
  constructor(
    readonly ecrClient: ECR,
    readonly repository: string,
    readonly tag: string,
    readonly immutable: boolean
  ) {}

  async execute(): Promise<string> {
    const registryUri = await ecrHelper.login(this.ecrClient);
    core.setOutput('registry', registryUri);

    await this.createRepository(this.repository, this.immutable);
    core.info(`pushing ${this.repository}:${this.tag} to default ECR`);
    await docker.push(registryUri, this.repository, this.tag);

    await docker.logout(registryUri);
    return '';
  }

  private async createRepository(
    repository: string,
    immutable: boolean
  ): Promise<void> {
    const describeRepositories = new DescribeRepositoriesCommand({
      repositoryNames: [repository],
    });

    try {
      core.debug('Checking repository exists.');
      await this.ecrClient.send(describeRepositories);
    } catch (err) {
      if (err instanceof RepositoryNotFoundException) {
        const createRepository = new CreateRepositoryCommand({
          repositoryName: repository,
          imageTagMutability: immutable ? 'IMMUTABLE' : 'MUTABLE',
        });
        core.debug(
          `Repository doesn't exist, creating with ${JSON.stringify(
            createRepository
          )}`
        );
        await this.ecrClient.send(createRepository);
      } else if (err instanceof Error) {
        core.setFailed(`Error with create repository: ${err.message}`);
      } else {
        core.setFailed(`Unknown error with create repository: ${err}`);
      }
    }
  }
}
