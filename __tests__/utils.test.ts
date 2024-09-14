import { addSummary, getBuildName } from '../src/utils';
import { BuildProgress, BuildResponse, BuildStatus } from '@sap-cx-actions/models';
import * as core from '@actions/core';
import dayjs from 'dayjs';

jest.mock('@actions/core', () => ({
  summary: {
    addHeading: jest.fn(),
    addTable: jest.fn(),
    addLink: jest.fn()
  }
}));

describe('utils', () => {
  describe('getBuildName', () => {
    it('should return sanitized branch name when buildName is empty', async () => {
      const branch = 'release/v1.0.0';
      const buildName = '';
      const result = await getBuildName(branch, buildName);
      expect(result).toBe('Release V1 0 0');
    });

    it('should return buildName when it is provided', async () => {
      const branch = 'release/v1.0.0';
      const buildName = 'CustomBuildName';
      const result = await getBuildName(branch, buildName);
      expect(result).toBe('CustomBuildName');
    });
  });

  describe('addSummary', () => {
    it('should add a summary with the correct build details', async () => {
      const buildResponse: BuildResponse = {
        applicationCode: 'commerce-cloud',
        applicationDefinitionVersion: '',
        createdBy: 'S000121212',
        deployed: false,
        hasSnapshot: false,
        isPreview: false,
        properties: [],
        status: BuildStatus.SUCCESS,
        buildEndTimestamp: new Date(),
        buildVersion: '',
        name: 'BuildName',
        branch: 'main',
        buildStartTimestamp: new Date(),
        subscriptionCode: 'subCode',
        code: 'buildCode'
      };
      const buildProgress: BuildProgress = {
        subscriptionCode: 'subCode',
        errorMessage: null,
        numberOfTasks: 2,
        percentage: 50,
        startedTasks: [],
        buildCode: 'buildCode',
        buildStatus: BuildStatus.SUCCESS
      };

      await addSummary(buildResponse, buildProgress);

      expect(core.summary.addHeading).toHaveBeenCalledWith('SAP Commerce Cloud - Build Summary :package:');
      expect(core.summary.addTable).toHaveBeenCalledWith([
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
          `${dayjs(buildResponse.buildStartTimestamp).format('YYYY-MM-DD HH:mm:ss')}`,
          buildProgress.buildStatus
        ]
      ]);
    });

    it('should add a link to the Cloud Portal', async () => {
      const buildResponse: BuildResponse = {
        applicationCode: 'commerce-cloud',
        applicationDefinitionVersion: '',
        createdBy: 'S000121212',
        deployed: false,
        hasSnapshot: false,
        isPreview: false,
        properties: [],
        status: BuildStatus.SUCCESS,
        buildEndTimestamp: new Date(),
        buildVersion: '',
        name: 'BuildName',
        branch: 'main',
        buildStartTimestamp: new Date(),
        subscriptionCode: 'subCode',
        code: 'buildCode'
      };
      const buildProgress: BuildProgress = {
        subscriptionCode: 'subCode',
        errorMessage: null,
        numberOfTasks: 2,
        percentage: 50,
        startedTasks: [],
        buildCode: 'buildCode',
        buildStatus: BuildStatus.SUCCESS
      };

      await addSummary(buildResponse, buildProgress);

      expect(core.summary.addLink).toHaveBeenCalledWith(
        'View in Cloud Portal',
        `https://cloudportal.sap.com/subscription/${buildResponse.subscriptionCode}/applications/commerce-cloud/builds/${buildResponse.code}`
      );
    });
  });
});
