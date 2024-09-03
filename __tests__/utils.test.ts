import { getBuildName } from '../src/utils';

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
