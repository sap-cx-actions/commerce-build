import {BuildStatus} from "./BuildStatus";
import {Task} from "./Task";

export interface BuildProgress {
    subscriptionCode: string;
    buildCode: string;
    errorMessage: string | null;
    numberOfTasks: number;
    percentage: number;
    buildStatus: BuildStatus;
    startedTasks: Task[];
}