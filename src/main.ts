import * as core from '@actions/core'
import { BuildProgress, BuildRequest, BuildResponse, BuildStatus } from './models/build'
import { BuildService } from './services/BuildService'

export async function run(): Promise<void> {
  let buildCode: string | undefined
  let buildStatus: BuildStatus | undefined

  try {
    core.info('Triggering the CCv2 Cloud build')
    const token: string = core.getInput('token')
    const subscriptionCode: string = core.getInput('subscriptionCode')
    const branch: string = core.getInput('branch')
    const buildName: string = core.getInput('buildName')
    const checkStatusInterval: number = parseInt(core.getInput('checkStatusInterval'), 10)
    const retryOnFailure: boolean = core.getInput('retryOnFailure') === 'true'
    const maxRetries: number = parseInt(core.getInput('maxRetries'), 10)
    const notify: boolean = core.getInput('notify') === 'true'
    const webhookUrl: string = core.getInput('webhookUrl')

    const buildService = new BuildService(token, subscriptionCode)

    let retries = 0
    while (retries < maxRetries) {
      try {
        // Create a new build
        const buildRequest: BuildRequest = {
          applicationCode: 'commerce-cloud',
          branch: branch,
          name: buildName
        }

        const buildResponse: BuildResponse = await buildService.createBuild(buildRequest)
        core.debug(`Create Build Response: ${JSON.stringify(buildResponse, null, 2)}`)
        buildCode = buildResponse.code

        // Get the build details
        if (buildCode) {
          const getBuild: BuildResponse = await buildService.getBuild(buildCode)
          core.debug(`Get Build Response: ${JSON.stringify(getBuild, null, 2)}`)
          buildStatus = getBuild.status //TODO check while building if the status is BUILDING or something else
        }

        // Send notification about build start.
        // TODO: Call notification service to send notification about build start.

        // Check build progress until status is SUCCESS or FAIL
        while (buildStatus === BuildStatus.BUILDING) {
          await new Promise(resolve => setTimeout(resolve, checkStatusInterval))
          if (buildCode) {
            const buildProgress: BuildProgress = await buildService.getBuildProgress(buildCode)
            core.debug(`Build Progress: ${JSON.stringify(buildProgress, null, 2)}`)
            buildStatus = buildProgress.buildStatus
          }
        }

        if (buildStatus === BuildStatus.SUCCESS) {
          if (notify) {
            core.info('Sending notification about build success...') // TODO: Call notification service to send notification about build success.
          }
          break // Exit loop if build is successful
        } else if (buildStatus === BuildStatus.FAIL) {
          core.error('Build failed.')
          if (!retryOnFailure) {
            core.setFailed('Build failed and retry is disabled.')
            return
          }
          retries++
          if (retries >= maxRetries) {
            core.setFailed(`Build failed after ${maxRetries} retries.`)
            return
          }
          core.info(`Retrying build creation (${retries}/${maxRetries})...`)
        }
      } catch (error) {
        core.setFailed(`Error during build process: ${(error as Error).message}`)
        return
      }
    }

    core.setOutput('buildCode', buildCode)
    core.setOutput('buildStatus', buildStatus)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
