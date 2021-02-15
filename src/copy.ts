import * as aws from 'aws-sdk';
import { Pull } from './pull';
import { Push } from './push';
import * as core from '@actions/core';

export class Copy {
  constructor(
    readonly ecrClient: aws.ECR,
    readonly sourceAccountRole: string,
    readonly sourceAccountId: string,
    readonly repository: string,
    readonly tag: string
  ) {}

  async execute(): Promise<void> {
    // role switch && log in to source environment
    const sts = new aws.STS();
    const currentIdentity = await sts.getCallerIdentity().promise();
    core.debug(`current identity: ${JSON.stringify(currentIdentity)}`);
    const originalRole: string = currentIdentity.Arn || '';

    const response = await sts
      .assumeRole({
        RoleArn: this.sourceAccountRole,
        RoleSessionName: 'awssdk-github-action',
      })
      .promise();
    core.debug(`role assumtpion response: ${JSON.stringify(response)}`);

    // pull
    const pull = new Pull(
      this.ecrClient,
      this.repository,
      this.tag,
      this.sourceAccountId,
      true
    );

    await pull.execute();

    // switch role back?
    // log in to current environment
    await sts
      .assumeRole({
        RoleArn: originalRole,
        RoleSessionName: 'awssdk-github-action',
      })
      .promise();
    // push
    const push = new Push(this.ecrClient, this.repository, this.tag);
    await push.execute();
    // log out
  }
}
