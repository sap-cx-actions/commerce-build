import { BuildProgress, BuildResponse } from '@sap-cx-actions/models';
import * as core from '@actions/core';
import dayjs from 'dayjs';
import { SAP } from '@sap-cx-actions/commerce-services';

export async function getBuildName(branch: string, buildName: string): Promise<string> {
  if (!buildName) {
    return branch.replace(/[^a-zA-Z0-9]/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  }
  return buildName;
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
