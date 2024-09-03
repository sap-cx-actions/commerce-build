export async function getBuildName(branch: string, buildName: string): Promise<string> {
  if (!buildName) {
    return branch.replace(/[^a-zA-Z0-9]/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  }
  return buildName;
}
