import { ECR } from "@aws-sdk/client-ecr";
import AWS_STS, { STS } from "@aws-sdk/client-sts";
import * as core from '@actions/core';
import { Pull } from './pull';
import { Push } from './push';

export class Copy {
  constructor(
    readonly ecrClient: ECR,
    readonly sourceAccountRole: string,
    readonly sourceAccountId: string,
    readonly repository: string,
    readonly tag: string,
    readonly immutable: boolean
  ) {}

  async execute(): Promise<void> {
    // role switch && log in to source environment
    const sts = new STS();
    const currentIdentity = await sts.getCallerIdentity();
    core.debug(`current identity: ${JSON.stringify(currentIdentity)}`);

    if (
      this.sourceAccountId === undefined ||
      this.sourceAccountId.length === 0
    ) {
      core.setFailed('Source account id is missing');
      return;
    }

    if (
      this.sourceAccountRole === undefined ||
      this.sourceAccountRole.length === 0
    ) {
      core.setFailed('Source role arn is missing');
      return;
    }

    await this.PullSourcePackage(sts);

    // push
    const push = new Push(
      this.ecrClient,
      this.repository,
      this.tag,
      this.immutable
    );
    await push.execute();
  }

  private async PullSourcePackage(sts: STS): Promise<void> {
    const assumedRole = await sts
      .assumeRole({
        RoleArn: this.sourceAccountRole,
        RoleSessionName: 'awssdk-github-action',
      });

    if (assumedRole === undefined || assumedRole.Credentials === undefined) {
      throw new Error(`Role assumption failed ${assumedRole.$response.error}`);
    }

    core.debug(`role assumption response: ${assumedRole.AssumedRoleUser?.Arn}`);
    this.maskSecrets(assumedRole);
    const ecrPullClient = new ECR({
      credentials: {
        accessKeyId: assumedRole.Credentials.AccessKeyId,
        expireTime: assumedRole.Credentials.Expiration,
        secretAccessKey: assumedRole.Credentials.SecretAccessKey,
        sessionToken: assumedRole.Credentials.SessionToken,
      },
    });

    const pull = new Pull(
      ecrPullClient,
      this.repository,
      this.tag,
      this.sourceAccountId,
      true
    );

    await pull.execute();
  }

  private maskSecrets(assumedRole: AWS_STS.AssumeRoleCommandOutput): void {
    if (assumedRole.Credentials) {
      core.setSecret(assumedRole.Credentials.AccessKeyId);
      core.setSecret(assumedRole.Credentials.SecretAccessKey);
      core.setSecret(assumedRole.Credentials.SessionToken);
    }
  }
}
