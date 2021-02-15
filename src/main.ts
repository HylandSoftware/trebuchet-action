import * as aws from 'aws-sdk';
import * as core from '@actions/core';
import { Push } from './push';
import { Copy } from './copy';
import { Pull } from './pull';

async function run(): Promise<void> {
  try {
    //const strip: boolean = (core.getInput("strip", { required: false }) || "false") === "true";
    //const region: string = core.getInput('region');

    const action: string = core.getInput('action');
    const repository: string = core.getInput('repository');
    const tag: string = core.getInput('tag');
    const sourceAccountId = core.getInput('source-account-id');
    const sourceRoleArn = core.getInput('source-role-arn');

    const ecrClient = new aws.ECR();

    switch (action) {
      case 'push': {
        const push = new Push(ecrClient, repository, tag);
        push.execute();
        break;
      }
      //case 'pull': {
      //  const promote = new Pull(ecrClient, repository, tag, sourceAccountId, true);
      //  promote.execute();
      //  break;
      //}
      case 'copy': {
        const promote = new Copy(ecrClient, sourceRoleArn, sourceAccountId, repository, tag);
        promote.execute();
        break;
      }
      default: {
        core.setFailed(
          `Unknown action ${action}.  Types 'push' and 'copy' are supported.`
        );
        break;
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
