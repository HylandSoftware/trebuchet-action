import * as core from '@actions/core';
import * as exec from '@actions/exec';

export async function login(
  username: string,
  password: string,
  endpoint: string
): Promise<void> {
  await dockerExecute('login', ['-u', username, '-p', password, endpoint]);
}

export async function logout(registry: string): Promise<void> {
  await dockerExecute('logout', [registry]);
}

export async function pull(
  registryUri: string,
  repository: string,
  tag: string
): Promise<void> {
  const ecrImageUri = `${registryUri}/${repository}:${tag}`;
  await dockerExecute('pull', [ecrImageUri]);
}

export async function stripRegistry(
  registryUri: string,
  repository: string,
  tag: string
): Promise<void> {
  const ecrImageUri = `${registryUri}/${repository}:${tag}`;
  const imageUri = `${repository}:${tag}`;
  await dockerExecute('tag', [ecrImageUri, imageUri]);
}

export async function push(
  registryUri: string,
  repository: string,
  tag: string
): Promise<void> {
  const imageUri = `${repository}:${tag}`;
  const ecrImageUri = `${registryUri}/${repository}:${tag}`;
  await dockerExecute('tag', [imageUri, ecrImageUri]);
  await dockerExecute('push', [ecrImageUri]);
}

async function dockerExecute(
  command: string,
  parameters: string[]
): Promise<void> {
  let stdout = '';
  let stderr = '';
  core.debug(`executing 'docker ${command} ${parameters.join(' ')}`);
  const exitCode = await exec.exec(`docker ${command}`, parameters, {
    silent: true,
    ignoreReturnCode: true,
    listeners: {
      stdout: (data: Buffer) => {
        stdout += data.toString();
      },
      stderr: (data: Buffer) => {
        stderr += data.toString();
      },
    },
  });

  if (exitCode !== 0) {
    core.debug(`Output: ${stdout}`);
    core.debug(`Standard Error: ${stderr}`);
    core.setFailed(`Could not login: ${stdout} ${stderr}`);
    throw new Error(`Could not login: ${stdout} ${stderr}`);
  }
}
