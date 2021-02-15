import * as aws from 'aws-sdk';
import * as core from '@actions/core';
import * as docker from './docker';

export async function login(ecrClient: aws.ECR): Promise<string> {
  core.debug(`getting ECR auth token`);

  const authTokenRequest: aws.ECR.GetAuthorizationTokenRequest = {};
  const authTokenResponse = await ecrClient
    .getAuthorizationToken(authTokenRequest)
    .promise();

  if (
    authTokenResponse.authorizationData === undefined ||
    !Array.isArray(authTokenResponse.authorizationData) ||
    !authTokenResponse.authorizationData.length ||
    authTokenResponse.authorizationData[0].authorizationToken === undefined ||
    authTokenResponse.authorizationData[0].proxyEndpoint === undefined
  ) {
    core.setFailed('Error getting ECR login token, incomplete or no data returned');
    throw new Error(
      'Error getting ECR login token, incomplete or no data returned'
    );
  }

  const authToken = Buffer.from(
    authTokenResponse.authorizationData[0].authorizationToken,
    'base64'
  ).toString('utf-8');
  const split = authToken.split(':', 2);
  const proxyEndpoint = authTokenResponse.authorizationData[0].proxyEndpoint;
  const registryUri = proxyEndpoint.replace(/^https?:\/\//, '');

  core.debug(`logging into ECR with docker: ${registryUri}`);
  await docker.login(split[0], split[1], registryUri);

  return registryUri;
}
