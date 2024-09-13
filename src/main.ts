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
import { getBuildName } from './utils';
import dayjs from 'dayjs';

export async function run(): Promise<void> {
  let buildCode: string | undefined;
  let buildStatus: BuildStatus | undefined;
  let buildResponse: BuildResponse;
  let buildProgress: BuildProgress;
  let retries = 0;

  try {
    core.info('Triggering the CCv2 Cloud build');
    const input: BuildInput = {
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
    const shouldNotify = (): boolean => input.notify && input.destination !== '';
    const notifier = shouldNotify() ? new Notifier(input.destination) : null;

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

      await core.summary
        .addHeading('SAP Commerce Cloud - Build Summary :package:')
        .addTable([
          [
            { data: 'Build Code', header: true },
            { data: 'Build Name', header: true },
            { data: 'Branch/Tag', header: true },
            { data: 'Build Started', header: true },
            { data: 'Build Status', header: true }
          ],
          [
            buildProgress.buildCode,
            buildResponse.name,
            buildResponse.branch,
            `${dayjs(buildResponse.buildStartTimestamp).format('MMMM DD, YYYY hh:mm:ss A Z')}`,
            buildProgress.buildStatus
          ]
        ])
        .addLink(
          'View in Cloud Portal',
          `https://portal.commerce.ondemand.com/subscription/${buildResponse.subscriptionCode}/applications/commerce-cloud/builds/${buildResponse.code}`
        )
        .write();
    } else {
      core.setFailed('Failed to trigger the build');
    }

    core.setOutput('buildCode', buildCode);
    core.setOutput('buildStatus', buildStatus);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}
