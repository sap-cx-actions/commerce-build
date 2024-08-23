import * as core from '@actions/core'
import axios from 'axios'

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

        core.info(`token: ${token}`);
        core.info(`subscriptionCode: ${subscriptionCode}`);
        core.info(`branch: ${branch}`);
        core.info(`buildName: ${buildName}`);
        core.info(`checkStatusInterval: ${checkStatusInterval}`);
        core.info(`retryOnFailure: ${retryOnFailure}`);
        core.info(`maxRetries: ${maxRetries}`);
        core.info(`enableNotifications: ${enableNotifications}`);
        core.info(`webhookUrl: ${webhookUrl}`);

        const apiUrl = 'https://reqres.in/api/users'
        try {
            const response = await axios.get(apiUrl)
            core.info(`Response status: ${response.status}`)
            core.info(`Response data: ${JSON.stringify(response.data, null, 2)}`)
        } catch (error) {
            core.setFailed(`Error fetching data: ${(error as Error).message}`)
        }

        core.setOutput('buildCode', '20240824.1');
        core.setOutput('buildStatus', 'SUCCESS');

    } catch (error) {
        // Fail the workflow run if an error occurs
        if (error instanceof Error) core.setFailed(error.message)
    }
}