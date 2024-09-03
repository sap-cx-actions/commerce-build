import * as core from '@actions/core';
import { BuildRequest, BuildResponse, BuildStatus, ActionInput, NotificationType } from '@sap-cx-actions/models';
import { BuildService } from '@sap-cx-actions/commerce-services';
import { Notifier } from '@sap-cx-actions/notifier';
import { getBuildName } from './utils';

export async function run(): Promise<void> {
  let buildCode: string | undefined;
  let buildStatus: BuildStatus | undefined;

  try {
    core.info('Triggering the CCv2 Cloud build');
    const input: ActionInput = {
      token: core.getInput('token'),
      subscriptionCode: core.getInput('subscriptionCode'),
      branch: core.getInput('branch'),
      buildName: await getBuildName(core.getInput('branch'), core.getInput('buildName')),
      checkStatusInterval: parseInt(core.getInput('checkStatusInterval'), 10),
      retryOnFailure: core.getBooleanInput('retryOnFailure'),
      maxRetries: parseInt(core.getInput('maxRetries'), 10),
      notify: core.getBooleanInput('notify'),
      destination: core.getInput('destination')
    };

    const buildService = new BuildService(input.token, input.subscriptionCode);
    const notifier = new Notifier(input.destination);

    // Create a new build
    const buildRequest: BuildRequest = {
      applicationCode: 'commerce-cloud',
      branch: input.branch,
      name: input.buildName
    };

    try {
      const buildResponse: BuildResponse = await buildService.createBuild(buildRequest);
      core.debug(`Create Build Response: ${JSON.stringify(buildResponse, null, 2)}`);
      buildCode = buildResponse.code;

      // Get the build details
      if (buildCode) {
        const getBuild: BuildResponse = await buildService.getBuild(buildCode);
        core.debug(`Get Build Response: ${JSON.stringify(getBuild, null, 2)}`);
        buildStatus = getBuild.status;

        if (input.notify && input.destination) {
          core.debug('Sending notification...');
          await notifier.notify(NotificationType.BUILD_STARTED, getBuild);
        }
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
