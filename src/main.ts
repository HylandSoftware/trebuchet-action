import { ECR } from '@aws-sdk/client-ecr';
import * as core from '@actions/core';
import { Copy } from './copy';
import { Push } from './push';

async function run(): Promise<void> {
  try {
    const action: string = core.getInput('action');
    const repoTagList: string = core.getInput('images');
    const sourceAccountId = core.getInput('source-account-id');
    const sourceRoleArn = core.getInput('source-role-arn');
    const immutable: boolean =
      (core.getInput('immutable', { required: false }) || 'false') === 'true';
    const ecrClient = new ECR({});

    const pairs = repoTagList.split(',').map(pair => pair.trim());

    for (const pair of pairs) {
      const [repository, tag] = pair.split(':');

      if (!repository || repository.length === 0) {
        core.setFailed('Repository parameter is missing');
        return;
      }

      if (!tag || tag.length === 0) {
        core.setFailed('Tag parameter is missing');
        return;
      }

      switch (action) {
        case 'push': {
          const push = new Push(ecrClient, repository, tag, immutable);
          await push.execute();
          break;
        }
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
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed(`Action failed with error ${error}`);
    }
  }
}

run();
