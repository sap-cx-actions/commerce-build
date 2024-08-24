import {Property} from "./Property";
import {BuildStatus} from "./BuildStatus";

export interface BuildResponse {
    applicationCode: string;
    applicationDefinitionVersion: string;
    branch: string;
    buildEndTimestamp: Date;
    buildStartTimestamp: Date;
    buildVersion: string;
    code: string;
    createdBy: string;
    deployed: boolean;
    hasSnapshot: boolean;
    isPreview: boolean;
    name: string;
    properties: Property[];
    status: BuildStatus;
    subscriptionCode: string;
}
