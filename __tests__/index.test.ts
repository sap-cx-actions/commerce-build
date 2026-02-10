const createBuildMock = jest.fn();
const getBuildMock = jest.fn();
const getBuildProgressMock = jest.fn();
const notifyMock = jest.fn();

jest.mock('@sap-cx-actions/models', () => ({
  BuildStatus: {
    UNKNOWN: 'UNKNOWN',
    BUILDING: 'BUILDING',
    FAIL: 'FAIL',
    SUCCESS: 'SUCCESS'
  },
  NotificationType: {
    BUILD_TRIGGERED: 'BUILD_TRIGGERED',
    BUILD_FAIL: 'BUILD_FAIL',
    BUILD_SUCCESS: 'BUILD_SUCCESS'
  }
}));

jest.mock('@sap-cx-actions/commerce-services', () => ({
  BuildService: class {
    constructor() {}
    createBuild(...args: unknown[]) {
      return createBuildMock(...args);
    }
    getBuild(...args: unknown[]) {
      return getBuildMock(...args);
    }
    getBuildProgress(...args: unknown[]) {
      return getBuildProgressMock(...args);
    }
  }
}));

jest.mock('@sap-cx-actions/notifier', () => ({
  Notifier: class {
    constructor() {}
    notify(...args: unknown[]) {
      return notifyMock(...args);
    }
  }
}));

const flushPromises = () => new Promise(resolve => setImmediate(resolve));

const setupIndex = async (inputs: Record<string, unknown>, options?: { validateInputsImpl?: () => void }) => {
  jest.resetModules();
  const validateInputsMock = jest.fn(options?.validateInputsImpl);
  const buildNotificationMock = jest.fn((type: string, content: unknown) => ({ type, content }));
  const addSummaryMock = jest.fn();

  jest.doMock('../src/utils', () => ({
    getInputs: inputs,
    validateInputs: validateInputsMock,
    buildNotification: buildNotificationMock,
    addSummary: addSummaryMock,
    getWorkflowRunUrl: jest.fn()
  }));

  const core = require('@actions/core') as typeof import('@actions/core');
  const setFailedSpy = jest.spyOn(core, 'setFailed').mockImplementation(() => {});
  const setOutputSpy = jest.spyOn(core, 'setOutput').mockImplementation(() => {});

  const timeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((cb: any) => {
    if (typeof cb === 'function') cb();
    return 0 as unknown as NodeJS.Timeout;
  });

  require('../src/index');
  await flushPromises();

  timeoutSpy.mockRestore();

  return {
    core,
    validateInputsMock,
    buildNotificationMock,
    addSummaryMock,
    setFailedSpy,
    setOutputSpy
  };
};

describe('index run', () => {
  beforeEach(() => {
    createBuildMock.mockReset();
    getBuildMock.mockReset();
    getBuildProgressMock.mockReset();
    notifyMock.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('runs a successful build flow with notifications', async () => {
    createBuildMock.mockResolvedValue({ code: 'C1' });
    getBuildMock
      .mockResolvedValueOnce({
        code: 'C1',
        status: 'BUILDING',
        name: 'Build',
        branch: 'main',
        subscriptionCode: 'SUB',
        buildStartTimestamp: '2024-01-01T00:00:00Z'
      })
      .mockResolvedValueOnce({
        code: 'C1',
        status: 'SUCCESS',
        name: 'Build',
        branch: 'main',
        subscriptionCode: 'SUB',
        buildStartTimestamp: '2024-01-01T00:00:00Z'
      });
    getBuildProgressMock
      .mockResolvedValueOnce({ buildStatus: 'UNKNOWN' })
      .mockResolvedValueOnce({ buildStatus: 'BUILDING', percentage: 50 })
      .mockResolvedValueOnce({ buildStatus: 'BUILDING', percentage: 100 })
      .mockResolvedValueOnce({ buildStatus: 'SUCCESS', percentage: 100 });

    const { buildNotificationMock, addSummaryMock, setFailedSpy, setOutputSpy } = await setupIndex({
      token: 'token',
      subscriptionCode: 'sub',
      branch: 'main',
      buildName: 'Build',
      checkStatusInterval: 1,
      retryOnFailure: false,
      maxRetries: 0,
      notify: true,
      webhookUrl: 'https://hooks.example.test',
      dryRun: false,
      timezone: 'UTC'
    });

    expect(buildNotificationMock).toHaveBeenCalledWith('BUILD_TRIGGERED', expect.any(Object));
    expect(buildNotificationMock).toHaveBeenCalledWith('BUILD_SUCCESS', expect.any(Object));
    expect(notifyMock).toHaveBeenCalledTimes(2);
    expect(addSummaryMock).toHaveBeenCalledTimes(1);
    expect(setFailedSpy).not.toHaveBeenCalled();
    expect(setOutputSpy).toHaveBeenCalledWith('buildCode', 'C1');
    expect(setOutputSpy).toHaveBeenCalledWith('buildStatus', 'SUCCESS');
  });

  it('retries a failed build and finishes without notifier', async () => {
    createBuildMock.mockResolvedValueOnce({ code: 'C1' }).mockResolvedValueOnce({ code: 'C2' });
    getBuildMock
      .mockResolvedValueOnce({
        code: 'C1',
        status: 'BUILDING',
        name: 'Build',
        branch: 'main',
        subscriptionCode: 'SUB',
        buildStartTimestamp: '2024-01-01T00:00:00Z'
      })
      .mockResolvedValueOnce({
        code: 'C2',
        status: 'BUILDING',
        name: 'Build 2',
        branch: 'main',
        subscriptionCode: 'SUB',
        buildStartTimestamp: '2024-01-01T00:00:00Z'
      })
      .mockResolvedValueOnce({
        code: 'C2',
        status: 'SUCCESS',
        name: 'Build 2',
        branch: 'main',
        subscriptionCode: 'SUB',
        buildStartTimestamp: '2024-01-01T00:00:00Z'
      });
    getBuildProgressMock
      .mockResolvedValueOnce({ buildStatus: 'FAIL' })
      .mockResolvedValueOnce({ buildStatus: 'SUCCESS', percentage: 100 });

    const { buildNotificationMock, setFailedSpy } = await setupIndex({
      token: 'token',
      subscriptionCode: 'sub',
      branch: 'main',
      buildName: 'Build',
      checkStatusInterval: 1,
      retryOnFailure: true,
      maxRetries: 1,
      notify: true,
      webhookUrl: '',
      dryRun: false,
      timezone: 'UTC'
    });

    expect(createBuildMock).toHaveBeenCalledTimes(2);
    expect(buildNotificationMock).not.toHaveBeenCalled();
    expect(notifyMock).not.toHaveBeenCalled();
    expect(setFailedSpy).not.toHaveBeenCalled();
  });

  it('fails without retries and notifies on build failure', async () => {
    createBuildMock.mockResolvedValue({ code: 'C1' });
    getBuildMock.mockResolvedValue({
      code: 'C1',
      status: 'BUILDING',
      name: 'Build',
      branch: 'main',
      subscriptionCode: 'SUB',
      buildStartTimestamp: '2024-01-01T00:00:00Z'
    });
    getBuildProgressMock.mockResolvedValue({ buildStatus: 'FAIL' });

    const { buildNotificationMock, setFailedSpy } = await setupIndex({
      token: 'token',
      subscriptionCode: 'sub',
      branch: 'main',
      buildName: 'Build',
      checkStatusInterval: 1,
      retryOnFailure: false,
      maxRetries: 0,
      notify: true,
      webhookUrl: 'https://hooks.example.test',
      dryRun: false,
      timezone: 'UTC'
    });

    expect(buildNotificationMock).toHaveBeenCalledWith('BUILD_TRIGGERED', expect.any(Object));
    expect(buildNotificationMock).toHaveBeenCalledWith('BUILD_FAIL', expect.any(Object));
    expect(notifyMock).toHaveBeenCalledTimes(2);
    expect(setFailedSpy).toHaveBeenCalledWith('Build failed');
  });

  it('handles missing build code', async () => {
    createBuildMock.mockResolvedValue({});

    const { setFailedSpy } = await setupIndex({
      token: 'token',
      subscriptionCode: 'sub',
      branch: 'main',
      buildName: 'Build',
      checkStatusInterval: 1,
      retryOnFailure: false,
      maxRetries: 0,
      notify: false,
      webhookUrl: '',
      dryRun: false,
      timezone: 'UTC'
    });

    expect(setFailedSpy).toHaveBeenCalledWith('Failed to trigger the build');
  });

  it('sets failed when validateInputs throws', async () => {
    createBuildMock.mockResolvedValue({ code: 'C1' });
    getBuildMock.mockResolvedValue({ code: 'C1', status: 'BUILDING' });
    getBuildProgressMock.mockResolvedValue({ buildStatus: 'SUCCESS', percentage: 100 });

    const { setFailedSpy } = await setupIndex(
      {
        token: '',
        subscriptionCode: '',
        branch: 'main',
        buildName: 'Build',
        checkStatusInterval: 1,
        retryOnFailure: false,
        maxRetries: 0,
        notify: false,
        webhookUrl: '',
        dryRun: false,
        timezone: 'UTC'
      },
      {
        validateInputsImpl: () => {
          throw new Error('Validation Failed');
        }
      }
    );

    expect(setFailedSpy).toHaveBeenCalledWith('Validation Failed');
  });

  it('fails after max retries with retry suffix', async () => {
    createBuildMock.mockResolvedValueOnce({ code: 'C1' }).mockResolvedValueOnce({ code: 'C2' });
    getBuildMock
      .mockResolvedValueOnce({
        code: 'C1',
        status: 'BUILDING',
        name: 'Build',
        branch: 'main',
        subscriptionCode: 'SUB',
        buildStartTimestamp: '2024-01-01T00:00:00Z'
      })
      .mockResolvedValueOnce({
        code: 'C2',
        status: 'BUILDING',
        name: 'Build 2',
        branch: 'main',
        subscriptionCode: 'SUB',
        buildStartTimestamp: '2024-01-01T00:00:00Z'
      });
    getBuildProgressMock.mockResolvedValueOnce({ buildStatus: 'FAIL' }).mockResolvedValueOnce({ buildStatus: 'FAIL' });

    const { setFailedSpy, buildNotificationMock } = await setupIndex({
      token: 'token',
      subscriptionCode: 'sub',
      branch: 'main',
      buildName: 'Build',
      checkStatusInterval: 1,
      retryOnFailure: true,
      maxRetries: 1,
      notify: true,
      webhookUrl: 'https://hooks.example.test',
      dryRun: false,
      timezone: 'UTC'
    });

    expect(buildNotificationMock).toHaveBeenCalledWith('BUILD_FAIL', expect.any(Object));
    expect(setFailedSpy).toHaveBeenCalledWith('Build failed after 1 retries');
  });
});
