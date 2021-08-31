import { Pull } from './pull';
import { Push } from './push';
import * as core from '@actions/core';
import * as aws from 'aws-sdk';

export class Copy {
  constructor(
    readonly ecrClient: aws.ECR,
    readonly sourceAccountRole: string,
    readonly sourceAccountId: string,
    readonly repository: string,
    readonly tag: string,
    readonly immutable: boolean
  ) {}

  async execute(): Promise<void> {
    // role switch && log in to source environment
    const sts = new aws.STS();
    const currentIdentity = await sts.getCallerIdentity().promise();
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

  private async PullSourcePackage(sts: aws.STS): Promise<void> {
    const assumedRole = await sts
      .assumeRole({
        RoleArn: this.sourceAccountRole,
        RoleSessionName: 'awssdk-github-action',
      })
      .promise();

    if (assumedRole === undefined || assumedRole.Credentials === undefined) {
      throw new Error(`Role assumption failed ${assumedRole.$response.error}`);
    }

    core.debug(`role assumption response: ${assumedRole.AssumedRoleUser?.Arn}`);
    this.maskSecrets(assumedRole);
    const ecrPullClient = new aws.ECR({
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

  private maskSecrets(assumedRole: aws.STS.AssumeRoleResponse): void {
    core.setSecret(assumedRole.Credentials!.AccessKeyId);
    core.setSecret(assumedRole.Credentials!.SecretAccessKey);
    core.setSecret(assumedRole.Credentials!.SessionToken);
  }
}
