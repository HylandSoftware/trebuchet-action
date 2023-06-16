import AWS_ECR, { ECR } from "@aws-sdk/client-ecr";
import * as core from '@actions/core';
import * as docker from './docker';

export async function login(
  ecrClient: ECR,
  accountId?: string
): Promise<string> {
  core.debug(`getting ECR auth token with account id ${accountId}`);

  const authTokenRequest: AWS_ECR.GetAuthorizationTokenCommandInput = {};
  if (accountId !== undefined) {
    authTokenRequest.registryIds = [accountId];
  }
  const authTokenResponse = await ecrClient
    .getAuthorizationToken(authTokenRequest);

  if (
    authTokenResponse.authorizationData === undefined ||
    !Array.isArray(authTokenResponse.authorizationData) ||
    !authTokenResponse.authorizationData.length ||
    authTokenResponse.authorizationData[0].authorizationToken === undefined ||
    authTokenResponse.authorizationData[0].proxyEndpoint === undefined
  ) {
    throw new Error(
      'Error getting ECR login token, incomplete or no data returned'
    );
  }

  const authToken = Buffer.from(
    authTokenResponse.authorizationData[0].authorizationToken,
    'base64'
  ).toString('utf-8');
  const split = authToken.split(':', 2);
  core.setSecret(authToken);
  core.setSecret(split[1]);
  const proxyEndpoint = authTokenResponse.authorizationData[0].proxyEndpoint;
  const registryUri = proxyEndpoint.replace(/^https?:\/\//, '');

  core.debug(`logging into ECR with docker: ${registryUri}`);

  await docker.login(split[0], split[1], registryUri);

  return registryUri;
}
