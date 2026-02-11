import type { BuildProgress, BuildResponse, NotificationType } from '@sap-cx-actions/models';
import { BuildStatus } from '@sap-cx-actions/models';
import dayjs from 'dayjs';

jest.mock('@sap-cx-actions/commerce-services', () => ({
  SAP: {
    CX: {
      Actions: {
        DATE_FORMAT: 'YYYY-MM-DD HH:mm',
        CLOUD_PORTAL_API_URL: 'https://portal.example.test'
      }
    }
  }
}));

const originalEnv = process.env;

const setInput = (name: string, value: string) => {
  process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] = value;
};

const loadUtils = (options?: {
  serverUrl?: string;
  envOverrides?: { token?: string; subCode?: string; webhookUrl?: string };
}) => {
  jest.resetModules();

  process.env = { ...originalEnv };
  const envOverrides = options?.envOverrides ?? {};

  if ('token' in envOverrides) {
    if (envOverrides.token !== undefined) {
      process.env.SAP_CCV2_API_TOKEN = envOverrides.token;
    } else {
      delete process.env.SAP_CCV2_API_TOKEN;
    }
  } else {
    process.env.SAP_CCV2_API_TOKEN = 'token';
  }

  if ('subCode' in envOverrides) {
    if (envOverrides.subCode !== undefined) {
      process.env.SAP_CCV2_SUB_CODE = envOverrides.subCode;
    } else {
      delete process.env.SAP_CCV2_SUB_CODE;
    }
  } else {
    process.env.SAP_CCV2_SUB_CODE = 'sub';
  }

  if ('webhookUrl' in envOverrides) {
    if (envOverrides.webhookUrl !== undefined) {
      process.env.WEBHOOK_URL = envOverrides.webhookUrl;
    } else {
      delete process.env.WEBHOOK_URL;
    }
  } else {
    process.env.WEBHOOK_URL = 'https://hooks.example.test';
  }
  if (options && 'serverUrl' in options) {
    if (options.serverUrl) {
      process.env.GITHUB_SERVER_URL = options.serverUrl;
    } else {
      delete process.env.GITHUB_SERVER_URL;
    }
  } else {
    process.env.GITHUB_SERVER_URL = 'https://ghe.example.test';
  }
  process.env.GITHUB_REPOSITORY = 'acme/commerce';
  process.env.GITHUB_RUN_ID = '456';

  setInput('branch', 'feature/test-1');
  setInput('buildName', '');
  setInput('checkStatusInterval', '250');
  setInput('retryOnFailure', 'true');
  setInput('maxRetries', '2');
  setInput('notify', 'true');
  setInput('dryRun', 'false');
  setInput('timezone', 'UTC');

  const utils = require('../src/utils') as typeof import('../src/utils');
  const core = require('@actions/core') as typeof import('@actions/core');
  return { utils, core };
};

describe('utils', () => {
  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it('getBuildName formats branch when build name is empty', () => {
    const { utils } = loadUtils();
    expect(utils.getBuildName('feature/test-1', '')).toBe('Feature Test 1');
  });

  it('getBuildName returns build name when provided', () => {
    const { utils } = loadUtils();
    expect(utils.getBuildName('feature/test-1', 'Nightly')).toBe('Nightly');
  });

  it('getWorkflowRunUrl builds a URL from context and server', () => {
    const { utils } = loadUtils();
    expect(utils.getWorkflowRunUrl()).toBe('https://ghe.example.test/acme/commerce/actions/runs/456');
  });

  it('getWorkflowRunUrl falls back to github.com when server URL is unset', () => {
    const { utils } = loadUtils({ serverUrl: '' });
    expect(utils.getWorkflowRunUrl()).toBe('https://github.com/acme/commerce/actions/runs/456');
  });

  it('getInputs falls back to empty strings when env vars are missing', () => {
    const { utils } = loadUtils({ envOverrides: { token: '', subCode: '', webhookUrl: '' } });
    expect(utils.getInputs.token).toBe('');
    expect(utils.getInputs.subscriptionCode).toBe('');
    expect(utils.getInputs.webhookUrl).toBe('');
  });

  it('validateInputs throws a combined error for missing values', () => {
    const { utils } = loadUtils();
    expect(() => utils.validateInputs({ token: '', subscriptionCode: '' })).toThrow(
      "Validation Failed: 'token' is required., 'subscriptionCode' is required."
    );
  });

  it('validateInputs passes when required values are present', () => {
    const { utils } = loadUtils();
    expect(() => utils.validateInputs({ token: 't', subscriptionCode: 's' })).not.toThrow();
  });

  it('buildNotification includes workflow URL and timezone', () => {
    const { utils } = loadUtils();
    const notification = utils.buildNotification('BUILD_TRIGGERED' as NotificationType, { id: 1 });

    expect(notification).toEqual({
      type: 'BUILD_TRIGGERED',
      content: { id: 1 },
      info: {
        timezone: 'UTC',
        workflowRunUrl: 'https://ghe.example.test/acme/commerce/actions/runs/456'
      }
    });
  });

  it('addSummary writes heading, table, and portal link', async () => {
    const { utils, core } = loadUtils();
    const summary = core.summary;

    const addHeadingSpy = jest.spyOn(summary, 'addHeading').mockImplementation(() => summary);
    const addTableSpy = jest.spyOn(summary, 'addTable').mockImplementation(() => summary);
    const addLinkSpy = jest.spyOn(summary, 'addLink').mockImplementation(() => summary);
    const writeSpy = jest.spyOn(summary, 'write').mockResolvedValue(undefined);

    const buildResponse: BuildResponse = {
      code: 'B123',
      name: 'Build One',
      branch: 'main',
      subscriptionCode: 'SUB',
      buildStartTimestamp: new Date('2024-02-15T10:11:12Z'),
      status: BuildStatus.SUCCESS
    };
    const buildProgress: BuildProgress = {
      buildCode: 'B123',
      buildStatus: BuildStatus.SUCCESS,
      percentage: 100
    };

    await utils.addSummary(buildResponse, buildProgress);

    expect(addHeadingSpy).toHaveBeenCalledWith('SAP Commerce Cloud - Build Summary :package:');
    const expectedTimestamp = dayjs(buildResponse.buildStartTimestamp).format('YYYY-MM-DD HH:mm');

    expect(addTableSpy).toHaveBeenCalledWith([
      [
        { data: 'Build Code', header: true },
        { data: 'Build Name', header: true },
        { data: 'Branch/Tag', header: true },
        { data: 'Build Started', header: true },
        { data: 'Build Status', header: true }
      ],
      ['B123', 'Build One', 'main', expectedTimestamp, 'SUCCESS']
    ]);
    expect(addLinkSpy).toHaveBeenCalledWith(
      'View in Cloud Portal',
      'https://portal.example.test/subscription/SUB/applications/commerce-cloud/builds/B123'
    );
    expect(writeSpy).toHaveBeenCalledTimes(1);
  });
});
