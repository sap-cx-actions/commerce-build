# SAP Commerce Cloud - Build

This GitHub Action provides the following functionalities to perform build operations on SAP Commerce Cloud in the
Public Cloud (CCv2) projects.

## Project Status

### 🚀 Completed Items

- [x] **Trigger Build**: Trigger SAP Commerce Cloud build.
- [x] **Build Notification**: Sends a notification when a build is triggered in CCv2.
- [x] **Build Status Notification**: Frequently check the build status and send notifications when success or failure.
- [x] **Retry On Failure**: Retry the build creation if it fails for the maxRetries times.
- [x] **Notifications**: Notify the user via email or webhook when the build is triggered or completed.
  - [x] Create Build: Triggered with build is created in CCv2.
  - [x] Build Completed: Triggered when the build is completed in CCv2 whether it is success or failure.
  - [x] Slack: Send notifications to Slack.
  - [x] Microsoft Teams: Send notifications to Microsoft Teams.

### 🔧 Planned Items

- [ ] **Testing**: Improve test coverage with end-to-end tests.
- [ ] **Notifications**: Notify the user via email or webhook when the build is triggered or completed.
  - [ ] Email: Send notifications to email.
    - [ ] SendGrid: Send notifications using SendGrid.
    - [ ] AWS SES: Send notifications using AWS SES.
    - [ ] Custom SMTP: Send notifications using custom SMTP.
    - [ ] Similar SMTP services.

## Getting Started

See [action.yml](action.yml)

### Prerequisites

- GitHub repository with SAP Commerce Cloud in the Public Cloud (CCv2) project.
- SAP Commerce Cloud in the Public Cloud (CCv2) project with the required configurations.
- Webhook URL (Slack or Microsoft Teams) or email address(es) to send notifications.
- GitHub Actions enabled in the repository.
- GitHub token with the required permissions.
- SAP Commerce Cloud in the Public Cloud (CCv2) API Token.
- SAP Commerce Cloud in the Public Cloud (CCv2) Subscription Code.

### Example Workflow

Create a workflow YAML file (e.g., .github/workflows/build.yml) in your repository with the following content:

```yaml
name: Build SAP Commerce Cloud

on:
  push:
    branches:
      - 'release/*'

jobs:
  test-build-action:
    name: GitHub Actions Test
    runs-on: ubuntu-latest

    env:
      SAP_CCV2_API_TOKEN: ${{ secrets.SAP_CCV2_API_TOKEN }}
      SAP_CCV2_SUB_CODE: ${{ secrets.SAP_CCV2_SUB_CODE }}
      WEBHOOK_URL: ${{ secrets.WEBHOOK_URL }}

    steps:
      - name: Checkout
        id: checkout
        uses: actions/checkout@v4

      - name: Test Local Action
        id: test-action
        uses: ./
        with:
          branch: release/v1.0.0
          buildName: Release v1.0.0
          checkStatusInterval: 60000
          retryOnFailure: true
          maxRetries: 3
          notify: true

      - name: Print Output
        id: output
        run: |
          echo "Build Code: ${{ steps.test-action.outputs.buildCode }}, Build Status: ${{ steps.test-action.outputs.buildStatus }}"
```

### Environment Variables

| Variable           | Purpose                                                                                                                                                                                                   | Required |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| SAP_CCV2_API_TOKEN | SAP Commerce Cloud in the Public Cloud (CCv2) [API Token](https://help.sap.com/docs/SAP_COMMERCE_CLOUD_PUBLIC_CLOUD/0fa6bcf4736c46f78c248512391eb467/65e64c9602534b8aaf25bb119670614f.html?locale=en-US). | True     |
| SAP_CCV2_SUB_CODE  | SAP Commerce Cloud in the Public Cloud (CCv2) Subscription Code                                                                                                                                           | True     |
| WEBHOOK_URL        | The Webhook URL to send notifications.                                                                                                                                                                    | False    |

### Inputs

| Attribute           | Purpose                                                 | Required | Default              | Example |
| ------------------- | ------------------------------------------------------- | -------- | -------------------- | ------- |
| branch              | The branch name or tag to trigger the build.            | True     | `release/v1.0.0`     |         |
| buildName           | The name of the build.                                  | False    |                      |         |
| checkStatusInterval | The interval in milliseconds to check the build status. | False    | `300000` (5 minutes) |         |
| retryOnFailure      | Retry the build if failed.                              | False    | `false`              |         |
| maxRetries          | The maximum number of retries.                          | False    | `3`                  |         |
| notify              | Send notifications on the build status.                 | False    | `false`              |         |

### Outputs

- `buildCode` - The build code of the triggered build.
- `buildStatus` - The status of the triggered build.
