import * as aws from 'aws-sdk';
import { Pull } from './pull';
import { Push } from './push';
import * as core from '@actions/core';

export class Promote {
  constructor(
    readonly ecrClient: aws.ECR,
    readonly lowerAccountRole: string,
    readonly lowerAccountId: string,
    readonly currentAccountId: string,
    readonly repository: string,
    readonly tag: string
  ) {}

  async execute(): Promise<void> {
    // role switch && log in to lower environment
    const sts = new aws.STS();
    const currentIdentity = await sts.getCallerIdentity().promise();
    core.debug(`current identity: ${JSON.stringify(currentIdentity)}`);
    const originalRole: string = currentIdentity.Arn || '';

    const response = await sts
      .assumeRole({
        RoleArn: this.lowerAccountRole,
        RoleSessionName: 'awssdk-github-action',
      })
      .promise();
    core.debug(`role assumtpion response: ${JSON.stringify(response)}`);

    // pull
    const pull = new Pull(
      this.ecrClient,
      this.repository,
      this.tag,
      this.lowerAccountId,
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
