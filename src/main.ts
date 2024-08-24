import * as core from '@actions/core'
import {BuildProgress, BuildRequest, BuildResponse, BuildStatus} from "./models/build";
import {BuildService} from "./services/BuildService";


export async function run(): Promise<void> {
    try {
        core.info('Triggering the CCv2 Cloud build');
        const token: string = core.getInput('token');
        const subscriptionCode: string = core.getInput('subscriptionCode');
        const branch: string = core.getInput('branch');
        const buildName: string = core.getInput('buildName');
        const checkStatusInterval: string = core.getInput('checkStatusInterval');
        const retryOnFailure: string = core.getInput('retryOnFailure');
        const maxRetries: string = core.getInput('maxRetries');
        const enableNotifications: string = core.getInput('enableNotifications');
        const webhookUrl: string = core.getInput('webhookUrl');

        const buildService = new BuildService(token, subscriptionCode);

        const buildRequest: BuildRequest = {
            applicationCode: '',
            branch: branch,
            name: buildName
        };

        try {
            const getBuild: BuildResponse = await buildService.getBuild('20240823.3');
            core.info(`getBuild Response: ${JSON.stringify(getBuild, null, 2)}`);
        } catch (error) {
            core.setFailed(`Error fetching data: ${(error as Error).message}`);
        }
        // core.setOutput('buildCode', buildResponse.code);
        // core.setOutput('buildStatus', buildResponse.status);
        core.setOutput('buildCode', '20240823.3');
        core.setOutput('buildStatus', BuildStatus.SUCCESS);
    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message)
    }
}