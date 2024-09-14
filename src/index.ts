import * as core from '@actions/core';
import {
  BuildRequest,
  BuildResponse,
  BuildStatus,
  NotificationType,
  BuildInput,
  BuildProgress
} from '@sap-cx-actions/models';
import { BuildService } from '@sap-cx-actions/commerce-services';
import { Notifier } from '@sap-cx-actions/notifier';
import { addSummary, getBuildName } from './utils';

export async function run(): Promise<void> {
  let buildCode: string | undefined;
  let buildStatus: BuildStatus | undefined;
  let buildResponse: BuildResponse;
  let buildProgress: BuildProgress;
  let retries = 0;

  try {
    core.info('Triggering the CCv2 Cloud build');
    const input: BuildInput = {
      token: process.env.SAP_CCV2_API_TOKEN || '',
      subscriptionCode: process.env.SAP_CCV2_SUB_CODE || '',
      branch: core.getInput('branch'),
      buildName: await getBuildName(core.getInput('branch'), core.getInput('buildName')),
      checkStatusInterval: parseInt(core.getInput('checkStatusInterval'), 10),
      retryOnFailure: core.getBooleanInput('retryOnFailure'),
      maxRetries: parseInt(core.getInput('maxRetries'), 10),
      notify: core.getBooleanInput('notify'),
      webhookUrl: process.env.WEBHOOK_URL || ''
    };

    // if token and subscription code are not provided, fail the action
    if (!input.token) {
      core.setFailed('Token is required');
      return;
    }

    if (!input.subscriptionCode) {
      core.setFailed('Subscription Code is required');
      return;
    }

    const buildService = new BuildService(input.token, input.subscriptionCode);
    const shouldNotify = (): boolean => input.notify && input.webhookUrl !== '';
    const notifier = shouldNotify() ? new Notifier(input.webhookUrl) : null;

    // Create a new build
    const buildRequest: BuildRequest = {
      applicationCode: 'commerce-cloud',
      branch: input.branch,
      name: input.buildName
    };

    // Trigger the build for the first time
    buildResponse = await buildService.createBuild(buildRequest);
    core.debug(`Create Build Response: ${JSON.stringify(buildResponse)}`);
    buildCode = buildResponse.code;

    // Get the build details
    if (buildCode) {
      buildResponse = await buildService.getBuild(buildCode);
      core.debug(`Get Build Response: ${JSON.stringify(buildResponse)}`);
      buildStatus = buildResponse.status;

      if (notifier) {
        await notifier.notify(NotificationType.BUILD_TRIGGERED, buildResponse);
      }

      do {
        buildProgress = await buildService.getBuildProgress(buildCode);
        core.debug(`Build Progress: ${JSON.stringify(buildProgress)}`);

        if (
          buildProgress.buildStatus === BuildStatus.BUILDING &&
          buildProgress.percentage !== undefined &&
          buildProgress.percentage !== null &&
          buildProgress.percentage < 100
        ) {
          buildStatus = BuildStatus.BUILDING;
          console.log(
            `Build is in progress. ${buildProgress.percentage}% completed, waiting for ${input.checkStatusInterval}ms`
          );
          await new Promise(resolve => setTimeout(resolve, input.checkStatusInterval));
        } else if (buildProgress.buildStatus === BuildStatus.FAIL) {
          if (input.retryOnFailure && retries < input.maxRetries) {
            core.info(`Build failed. Retrying... (${retries + 1}/${input.maxRetries})`);
            buildResponse = await buildService.createBuild(buildRequest);
            core.debug(
              `Create Build Response of retries (${retries + 1}/${input.maxRetries}): ${JSON.stringify(buildResponse)}`
            );
            buildCode = buildResponse.code;
            buildResponse = await buildService.getBuild(buildCode);
            retries++;
          } else {
            buildStatus = BuildStatus.FAIL;
            core.setFailed(`Build failed${input.retryOnFailure ? ` after ${retries} retries` : ''}`);
            if (notifier) {
              await notifier.notify(NotificationType.BUILD_FAIL, buildResponse);
            }
            break;
          }
        } else if (buildProgress.buildStatus === BuildStatus.SUCCESS && buildProgress.percentage === 100) {
          buildStatus = BuildStatus.SUCCESS;
          core.info('Build completed successfully');
          if (notifier) {
            await notifier.notify(NotificationType.BUILD_SUCCESS, buildResponse);
          }
          break;
        }
      } while (
        buildProgress.buildStatus === BuildStatus.BUILDING ||
        (buildProgress.buildStatus === BuildStatus.FAIL && input.retryOnFailure)
      );

      await addSummary(buildResponse, buildProgress);
    } else {
      core.setFailed('Failed to trigger the build');
    }

    core.setOutput('buildCode', buildCode);
    core.setOutput('buildStatus', buildStatus);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run()
  .then(r => r)
  .catch(e => core.setFailed(e));
