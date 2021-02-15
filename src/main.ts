import * as aws from 'aws-sdk';
import * as core from '@actions/core';
import { Push } from './push';
import { Promote } from './promote';

async function run(): Promise<void> {
  try {
    //const strip: boolean = (core.getInput("strip", { required: false }) || "false") === "true";
    //const region: string = core.getInput('region');

    const action: string = core.getInput('action');
    const repository: string = core.getInput('repository');
    const tag: string = core.getInput('tag');

    const ecrClient = new aws.ECR();

    switch (action) {
      case 'push': {
        const push = new Push(ecrClient, repository, tag);
        push.execute();
        break;
      }
      case 'promote': {
        const promote = new Promote(ecrClient, '', '', '', repository, tag);
        promote.execute();
        break;
      }
      default: {
        core.setFailed(
          `Unknown action ${action}.  Types 'pull' and 'promote' are supported.`
        );
        break;
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
