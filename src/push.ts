import * as aws from 'aws-sdk';
import * as core from '@actions/core';
import * as docker from './docker';
import * as ecrHelper from './ecr';

export class Push {
  constructor(
    readonly ecrClient: aws.ECR,
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
    try {
      core.debug('Checking repository exists.');
      await this.ecrClient
        .describeRepositories({
          repositoryNames: [repository],
        })
        .promise();
    } catch (err) {
      if (err.code === 'RepositoryNotFoundException') {
        const createRepoOptions: aws.ECR.Types.CreateRepositoryRequest = {
          repositoryName: repository,
          imageTagMutability: immutable ? 'IMMUTABLE' : 'MUTABLE',
        };
        core.debug(
          `Repository doesn't exist, creating with ${JSON.stringify(
            createRepoOptions
          )}`
        );
        await this.ecrClient.createRepository(createRepoOptions).promise();
      } else {
        core.setFailed(`Error testing for repository existence: ${err}`);
      }
    }
  }
}
