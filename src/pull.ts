import * as aws from 'aws-sdk';
import * as core from '@actions/core';
import * as docker from './docker';
import * as ecrHelper from './ecr';

export class Pull {
  constructor(
    readonly ecrClient: aws.ECR,
    readonly repository: string,
    readonly tag: string,
    readonly accountId?: string,
    readonly stripRegistry?: boolean
  ) {}

  async execute(): Promise<string> {
    const registryUri = await ecrHelper.login(this.ecrClient, this.accountId);
    if (this.accountId === undefined) {
      core.info(`pulling ${this.repository}:${this.tag} from default ECR`);
    } else {
      core.info(
        `pulling ${this.repository}:${this.tag} from ${this.accountId} ECR`
      );
    }
    await docker.pull(registryUri, this.repository, this.tag);
    if (this.stripRegistry === true) {
      docker.stripRegistry(registryUri, this.repository, this.tag);
    }

    await docker.logout(registryUri);
    return registryUri;
  }
}
