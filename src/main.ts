import * as core from '@actions/core';
import { BuildRequest, BuildResponse, BuildStatus } from '@sap-cx-actions/models';
import { BuildService } from '@sap-cx-actions/commerce-services';

export async function run(): Promise<void> {
  let buildCode: string | undefined;
  let buildStatus: BuildStatus | undefined;

  try {
    core.info('Triggering the CCv2 Cloud build');
    const token: string = core.getInput('token');
    const subscriptionCode: string = core.getInput('subscriptionCode');
    const branch: string = core.getInput('branch');
    const buildName: string = core.getInput('buildName');
    const checkStatusInterval: number = parseInt(core.getInput('checkStatusInterval'), 10);
    const retryOnFailure: boolean = core.getInput('retryOnFailure') === 'true';
    const maxRetries: number = parseInt(core.getInput('maxRetries'), 10);
    const notify: boolean = core.getInput('notify') === 'true';
    const webhookUrl: string = core.getInput('webhookUrl');

    const buildService = new BuildService(token, subscriptionCode);

    // Create a new build
    const buildRequest: BuildRequest = {
      applicationCode: 'commerce-cloud',
      branch: branch,
      name: buildName
    };

    try {
      const buildResponse: BuildResponse = await buildService.createBuild(buildRequest);
      core.debug(`Create Build Response: ${JSON.stringify(buildResponse, null, 2)}`);
      buildCode = buildResponse.code;

      // Get the build details
      if (buildCode) {
        const getBuild: BuildResponse = await buildService.getBuild(buildCode);
        core.debug(`Get Build Response: ${JSON.stringify(getBuild, null, 2)}`);
        buildStatus = getBuild.status; //TODO check while building if the status is BUILDING or something else
      }

      if (notify && webhookUrl) {
        // TODO: Call notification service to send notification about build start.
        // Send notification about build start.
      }

      core.setOutput('buildCode', buildCode);
      core.setOutput('buildStatus', buildStatus);
    } catch (error) {
      core.setFailed(`Error during build process: ${(error as Error).message}`);
      return;
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}
