import * as core from '@actions/core'
import axios from 'axios'
import {BuildResponse} from "./models/build";

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

        const apiUrl = `https://portalrotapi.hana.ondemand.com/v2/subscriptions/${subscriptionCode}/builds/20240823.3`

        try {
            const response = await axios.get<BuildResponse>(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            core.info(`Response status: ${response.status}`)
            core.info(`Build Status: ${response.data.status}`)
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