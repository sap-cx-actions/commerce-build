import { run } from '../src/main';
import { BuildService } from '@sap-cx-actions/commerce-services';
import { Notifier } from '@sap-cx-actions/notifier';
import { BuildRequest, BuildResponse, BuildStatus, NotificationType } from '@sap-cx-actions/models';
import * as core from '@actions/core';

jest.mock('@sap-cx-actions/commerce-services');
jest.mock('@sap-cx-actions/notifier');
jest.mock('@actions/core');

describe('run', () => {
  let getInputMock: jest.SpyInstance;
  let getBooleanInputMock: jest.SpyInstance;
  let setOutputMock: jest.SpyInstance;
  let setFailedMock: jest.SpyInstance;
  let buildServiceMock: jest.Mocked<BuildService>;
  let notifierMock: jest.Mocked<Notifier>;

  beforeEach(() => {
    getInputMock = jest.spyOn(core, 'getInput');
    getBooleanInputMock = jest.spyOn(core, 'getBooleanInput');
    setOutputMock = jest.spyOn(core, 'setOutput');
    setFailedMock = jest.spyOn(core, 'setFailed');
    buildServiceMock = new BuildService('test-token', 'test-subscription') as jest.Mocked<BuildService>;
    notifierMock = new Notifier('') as jest.Mocked<Notifier>;

    (BuildService as jest.Mock).mockImplementation(() => buildServiceMock);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should trigger the build and set outputs', async () => {
    getInputMock.mockImplementation((name: string) => {
      const inputs: { [key: string]: string } = {
        token: 'test-token',
        subscriptionCode: 'test-subscription',
        branch: 'main',
        buildName: 'test-build',
        checkStatusInterval: '10',
        retryOnFailure: 'false',
        maxRetries: '3',
        notify: 'false',
        destination: ''
      };
      return inputs[name];
    });

    getBooleanInputMock.mockImplementation((name: string) => {
      const inputs: { [key: string]: boolean } = {
        retryOnFailure: false,
        notify: false
      };
      return inputs[name];
    });

    const buildResponse: BuildResponse = {
      applicationCode: 'commerce-cloud',
      applicationDefinitionVersion: '1.0.0',
      branch: 'main',
      buildEndTimestamp: new Date(),
      buildStartTimestamp: new Date(),
      buildVersion: '1.0.0',
      code: 'build-code',
      createdBy: 'user',
      deployed: false,
      hasSnapshot: false,
      isPreview: false,
      name: 'test-build',
      properties: [],
      status: BuildStatus.BUILDING,
      subscriptionCode: 'test-subscription'
    };

    buildServiceMock.createBuild.mockResolvedValue(buildResponse);
    buildServiceMock.getBuild.mockResolvedValue(buildResponse);
    buildServiceMock.getBuildProgress.mockResolvedValue({
      buildCode: 'build-code',
      buildStatus: BuildStatus.SUCCESS,
      percentage: 100,
      subscriptionCode: 'test-subscription',
      errorMessage: null,
      numberOfTasks: 0,
      startedTasks: []
    });

    await run();

    expect(buildServiceMock.createBuild).toHaveBeenCalledWith({
      applicationCode: 'commerce-cloud',
      branch: 'main',
      name: 'test-build'
    } as BuildRequest);
    expect(buildServiceMock.getBuild).toHaveBeenCalledWith('build-code');
    expect(setOutputMock).toHaveBeenCalledWith('buildCode', 'build-code');
    expect(setOutputMock).toHaveBeenCalledWith('buildStatus', BuildStatus.SUCCESS);
  });

  it('should handle build failure and retry', async () => {
    getInputMock.mockImplementation((name: string) => {
      const inputs: { [key: string]: string } = {
        token: 'test-token',
        subscriptionCode: 'test-subscription',
        branch: 'main',
        buildName: 'test-build',
        checkStatusInterval: '10',
        retryOnFailure: 'true',
        maxRetries: '3',
        notify: 'false',
        destination: ''
      };
      return inputs[name];
    });

    getBooleanInputMock.mockImplementation((name: string) => {
      const inputs: { [key: string]: boolean } = {
        retryOnFailure: true,
        notify: false
      };
      return inputs[name];
    });

    const buildResponse: BuildResponse = {
      applicationCode: 'commerce-cloud',
      applicationDefinitionVersion: '1.0.0',
      branch: 'main',
      buildEndTimestamp: new Date(),
      buildStartTimestamp: new Date(),
      buildVersion: '1.0.0',
      code: 'build-code',
      createdBy: 'user',
      deployed: false,
      hasSnapshot: false,
      isPreview: false,
      name: 'test-build',
      properties: [],
      status: BuildStatus.FAIL,
      subscriptionCode: 'test-subscription'
    };

    buildServiceMock.createBuild.mockResolvedValueOnce(buildResponse);
    buildServiceMock.getBuild.mockResolvedValueOnce(buildResponse);
    buildServiceMock.getBuildProgress.mockResolvedValueOnce({
      buildCode: 'build-code',
      buildStatus: BuildStatus.FAIL,
      percentage: 50,
      subscriptionCode: 'test-subscription',
      errorMessage: null,
      numberOfTasks: 0,
      startedTasks: []
    });

    const buildResponseRetry: BuildResponse = {
      ...buildResponse,
      code: 'build-code-2',
      status: BuildStatus.SUCCESS
    };

    buildServiceMock.createBuild.mockResolvedValueOnce(buildResponseRetry);
    buildServiceMock.getBuild.mockResolvedValueOnce(buildResponseRetry);
    buildServiceMock.getBuildProgress.mockResolvedValueOnce({
      buildCode: 'build-code-2',
      buildStatus: BuildStatus.SUCCESS,
      percentage: 100,
      subscriptionCode: 'test-subscription',
      errorMessage: null,
      numberOfTasks: 0,
      startedTasks: []
    });

    await run();

    expect(buildServiceMock.createBuild).toHaveBeenCalledTimes(2);
    expect(buildServiceMock.createBuild).toHaveBeenCalledWith({
      applicationCode: 'commerce-cloud',
      branch: 'main',
      name: 'test-build'
    } as BuildRequest);
    expect(buildServiceMock.getBuild).toHaveBeenCalledWith('build-code-2');
    expect(setOutputMock).toHaveBeenCalledWith('buildCode', 'build-code-2');
    expect(setOutputMock).toHaveBeenCalledWith('buildStatus', BuildStatus.SUCCESS);
  });

  it('should handle build failure without retry', async () => {
    getInputMock.mockImplementation((name: string) => {
      const inputs: { [key: string]: string } = {
        token: 'test-token',
        subscriptionCode: 'test-subscription',
        branch: 'main',
        buildName: 'test-build',
        checkStatusInterval: '10',
        retryOnFailure: 'false',
        maxRetries: '3',
        notify: 'false',
        destination: ''
      };
      return inputs[name];
    });

    getBooleanInputMock.mockImplementation((name: string) => {
      const inputs: { [key: string]: boolean } = {
        retryOnFailure: false,
        notify: false
      };
      return inputs[name];
    });

    const buildResponse: BuildResponse = {
      applicationCode: 'commerce-cloud',
      applicationDefinitionVersion: '1.0.0',
      branch: 'main',
      buildEndTimestamp: new Date(),
      buildStartTimestamp: new Date(),
      buildVersion: '1.0.0',
      code: 'build-code',
      createdBy: 'user',
      deployed: false,
      hasSnapshot: false,
      isPreview: false,
      name: 'test-build',
      properties: [],
      status: BuildStatus.FAIL,
      subscriptionCode: 'test-subscription'
    };

    buildServiceMock.createBuild.mockResolvedValue(buildResponse);
    buildServiceMock.getBuild.mockResolvedValue(buildResponse);
    buildServiceMock.getBuildProgress.mockResolvedValue({
      buildCode: 'build-code',
      buildStatus: BuildStatus.FAIL,
      percentage: 50,
      subscriptionCode: 'test-subscription',
      errorMessage: null,
      numberOfTasks: 0,
      startedTasks: []
    });

    await run();

    expect(setFailedMock).toHaveBeenCalledWith('Build failed');
    expect(setOutputMock).toHaveBeenCalledWith('buildCode', 'build-code');
    expect(setOutputMock).toHaveBeenCalledWith('buildStatus', BuildStatus.FAIL);
  });

  it('should handle errors', async () => {
    getInputMock.mockImplementation((name: string) => {
      const inputs: { [key: string]: string } = {
        token: 'test-token',
        subscriptionCode: 'test-subscription',
        branch: 'main',
        buildName: 'test-build',
        checkStatusInterval: '10',
        retryOnFailure: 'false',
        maxRetries: '3',
        notify: 'false',
        destination: ''
      };
      return inputs[name];
    });

    getBooleanInputMock.mockImplementation((name: string) => {
      const inputs: { [key: string]: boolean } = {
        retryOnFailure: false,
        notify: false
      };
      return inputs[name];
    });

    buildServiceMock.createBuild.mockRejectedValue(new Error('Failed to create build'));

    await run();

    expect(setFailedMock).toHaveBeenCalledWith('Failed to create build');
  });
});
