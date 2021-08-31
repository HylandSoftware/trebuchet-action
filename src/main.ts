import * as aws from 'aws-sdk';
import * as core from '@actions/core';
import { Copy } from './copy';
import { Push } from './push';
// import { Pull } from './pull';

async function run(): Promise<void> {
  try {
    //const strip: boolean = (core.getInput("strip", { required: false }) || "false") === "true";
    //const region: string = core.getInput('region');

    const action: string = core.getInput('action');
    const repository: string = core.getInput('repository');
    const tag: string = core.getInput('tag');
    const sourceAccountId = core.getInput('source-account-id');
    const sourceRoleArn = core.getInput('source-role-arn');
    const immutable: boolean =
      (core.getInput('immutable', { required: false }) || 'false') === 'true';
    const ecrClient = new aws.ECR();

    if (repository === undefined || repository.length === 0) {
      core.setFailed('Repository parameter is missing');
      return;
    }

    if (tag === undefined || tag.length === 0) {
      core.setFailed('Tag parameter is missing');
      return;
    }

    switch (action) {
      case 'push': {
        const push = new Push(ecrClient, repository, tag, immutable);
        await push.execute();
        break;
      }
      //case 'pull': {
      //  const promote = new Pull(ecrClient, repository, tag, sourceAccountId, true);
      //  promote.execute();
      //  break;
      //}
      case 'copy': {
        const promote = new Copy(
          ecrClient,
          sourceRoleArn,
          sourceAccountId,
          repository,
          tag,
          immutable
        );
        await promote.execute();
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
    core.setFailed(error.message as string);
  }
}

run();
