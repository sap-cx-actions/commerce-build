import { run } from '../src/main';
import { BuildService } from '@sap-cx-actions/commerce-services';
import { Notifier } from '@sap-cx-actions/notifier';
import { BuildRequest, BuildResponse, BuildStatus } from '@sap-cx-actions/models';
import * as core from '@actions/core';

jest.mock('@sap-cx-actions/commerce-services');
jest.mock('@sap-cx-actions/notifier');
jest.mock('@actions/core');

describe('main', () => {
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

    await run();

    expect(buildServiceMock.createBuild).toHaveBeenCalledWith({
      applicationCode: 'commerce-cloud',
      branch: 'main',
      name: 'test-build'
    } as BuildRequest);
    expect(buildServiceMock.getBuild).toHaveBeenCalledWith('build-code');
    expect(setOutputMock).toHaveBeenCalledWith('buildCode', 'build-code');
    expect(setOutputMock).toHaveBeenCalledWith('buildStatus', BuildStatus.BUILDING);
  });

  it('should handle errors during build process', async () => {
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

    const error = new Error('Build failed');
    buildServiceMock.createBuild.mockRejectedValue(error);

    await run();

    expect(setFailedMock).toHaveBeenCalledWith('Error during build process: Build failed');
  });
});
