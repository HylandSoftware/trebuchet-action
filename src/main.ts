import { ECR } from '@aws-sdk/client-ecr';
import * as core from '@actions/core';
import { Copy } from './copy';
import { Push } from './push';
// import { Pull } from './pull';

async function run(): Promise<void> {
  try {
    //const strip: boolean = (core.getInput("strip", { required: false }) || "false") === "true";
    //const region: string = core.getInput('region');

    const action: string = core.getInput('action');
    const repositoryInput: string = core.getInput('repository');
    const repositoriesInput: string = core.getInput('repositories');
    const tag: string = core.getInput('tag');
    const sourceAccountId = core.getInput('source-account-id');
    const sourceRoleArn = core.getInput('source-role-arn');
    const immutable: boolean =
      (core.getInput('immutable', { required: false }) || 'false') === 'true';
    const ecrClient = new ECR({});

    if (repositoryInput !== undefined && repositoriesInput !== undefined) {
      core.setFailed('Repository and Repositories cannot both be set.');
      return;
    }

    if (
      (repositoryInput === undefined || repositoryInput.length === 0) &&
      (repositoriesInput === undefined || repositoriesInput.length === 0)
    ) {
      core.setFailed('Repository or Repositories parameter is required');
      return;
    }

    if (tag === undefined || tag.length === 0) {
      core.setFailed('Tag parameter is missing');
      return;
    }

    let repositories;

    if (repositoryInput !== undefined && repositoryInput.length > 0) {
      repositories = [repositoryInput];
    } else {
      repositories = repositoriesInput.split(/\r\n|\r|\n/g);
      if (repositories === undefined || repositories.length === 0) {
        core.setFailed('Repositories parameter is set to an invalid value');
      }
    }

    switch (action) {
      case 'push': {
        for (const repository of repositories) {
          const push = new Push(ecrClient, repository, tag, immutable);
          await push.execute();
        }
        break;
      }
      //case 'pull': {
      //  const promote = new Pull(ecrClient, repository, tag, sourceAccountId, true);
      //  promote.execute();
      //  break;
      //}
      case 'copy': {
        for (const repository of repositories) {
          const promote = new Copy(
            ecrClient,
            sourceRoleArn,
            sourceAccountId,
            repository,
            tag,
            immutable
          );
          await promote.execute();
        }
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
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed(`Action failed with error ${error}`);
    }
  }
}

run();
