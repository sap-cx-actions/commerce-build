import { BuildInput, BuildProgress, BuildResponse } from '@sap-cx-actions/models';
import * as core from '@actions/core';
import dayjs from 'dayjs';
import { SAP } from '@sap-cx-actions/commerce-services';

export function getBuildName(branch: string, buildName: string): string {
  if (!buildName) {
    return branch.replace(/[^a-zA-Z0-9]/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  }
  return buildName;
}

export const getInputs: BuildInput = {
  token: process.env.SAP_CCV2_API_TOKEN || '',
  subscriptionCode: process.env.SAP_CCV2_SUB_CODE || '',
  branch: core.getInput('branch', { required: true }),
  buildName: getBuildName(core.getInput('branch'), core.getInput('buildName')),
  checkStatusInterval: parseInt(core.getInput('checkStatusInterval'), 10),
  retryOnFailure: core.getBooleanInput('retryOnFailure'),
  maxRetries: parseInt(core.getInput('maxRetries'), 10),
  notify: core.getBooleanInput('notify'),
  webhookUrl: process.env.WEBHOOK_URL || '',
  dryRun: core.getBooleanInput('dryRun')
};

export function validateInputs(inputs: { [key: string]: string }): void {
  const errorMessages: string[] = [];

  for (const [key, value] of Object.entries(inputs)) {
    if (!value) {
      const errorMessage = `'${key}' is required.`;
      errorMessages.push(errorMessage);
    }
  }

  if (errorMessages.length > 0) {
    const errorMessage = `Validation Failed: ${errorMessages.join(', ')}`;
    throw new Error(errorMessage);
  }
}

export async function addSummary(buildResponse: BuildResponse, buildProgress: BuildProgress): Promise<void> {
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
        `${dayjs(buildResponse.buildStartTimestamp).format(SAP.CX.Actions.DATE_FORMAT)}`,
        buildProgress.buildStatus
      ]
    ])
    .addLink(
      'View in Cloud Portal',
      SAP.CX.Actions.CLOUD_PORTAL_URL +
        `/subscription/${buildResponse.subscriptionCode}/applications/commerce-cloud/builds/${buildResponse.code}`
    )
    .write();
}
