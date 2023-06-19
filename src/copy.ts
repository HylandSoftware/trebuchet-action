import { ECR } from '@aws-sdk/client-ecr';
import {
  STS,
  GetCallerIdentityCommand,
  AssumeRoleCommand,
} from '@aws-sdk/client-sts';
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
    const sts = new STS({});
    const command = new GetCallerIdentityCommand({});
    const currentIdentity = await sts.send(command);
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
    const command = new AssumeRoleCommand({
      RoleArn: this.sourceAccountRole,
      RoleSessionName: 'awssdk-github-action',
    });

    try {
      const assumedRole = await sts.send(command);
      core.debug(
        `role assumption response: ${assumedRole.AssumedRoleUser?.Arn}`
      );
      const accessKeyId = assumedRole.Credentials?.AccessKeyId ?? '';
      const secretAccessKey = assumedRole.Credentials?.SecretAccessKey ?? '';
      const sessionToken = assumedRole.Credentials?.SessionToken ?? '';

      // Mask secrets
      if (assumedRole.Credentials) {
        core.setSecret(accessKeyId);
        core.setSecret(secretAccessKey);
        core.setSecret(sessionToken);
      }
      const ecrPullClient = new ECR({
        credentials: {
          accessKeyId,
          secretAccessKey,
          sessionToken,
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
    } catch (error) {
      throw new Error(`Role assumption failed ${error}`);
    }
  }
}
