import { BuildProgress, BuildStatus, Task } from '../../../src/models/build'


describe('BuildProgress', () => {
  it('should have the correct properties', () => {
    const buildProgress: BuildProgress = {
      subscriptionCode: '458eba4f7e7cdaa9f9275c22c2dc9cbc',
      buildCode: '20240823.3',
      errorMessage: null,
      numberOfTasks: 5,
      percentage: 50,
      buildStatus: BuildStatus.BUILDING,
      startedTasks: [] as Task[]
    };

    expect(buildProgress).toHaveProperty('subscriptionCode', '458eba4f7e7cdaa9f9275c22c2dc9cbc');
    expect(buildProgress).toHaveProperty('buildCode', '20240823.3');
    expect(buildProgress).toHaveProperty('errorMessage', null);
    expect(buildProgress).toHaveProperty('numberOfTasks', 5);
    expect(buildProgress).toHaveProperty('percentage', 50);
    expect(buildProgress).toHaveProperty('buildStatus', BuildStatus.BUILDING);
    expect(buildProgress).toHaveProperty('startedTasks', []);
  });
});