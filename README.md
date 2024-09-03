# SAP Commerce Cloud - Build

This GitHub Action provides the following functionalities to perform build operations on SAP Commerce Cloud in the
Public Cloud (CCv2) projects.

## Project Status

### 🚀 Completed Items

- [x] **Trigger Build**: Trigger SAP Commerce Cloud build.

### 🔧 Planned Items

- [ ] **Build Notification**: Sends a notification when a build is triggered in CCv2.
- [ ] **Build Status Notification**: Frequently check the build status and send notifications when success or failure.
- [ ] **Retry On Failure**: Retry the build creation if it fails for the maxRetries times.
- [ ] **Testing**: Improve test coverage with end-to-end tests.
- [ ] **Notifications**: Notify the user via email or webhook when the build is triggered or completed.
  - [ ] Create Build: Triggered with build is created in CCv2.
  - [ ] Build Progress: Check the build status and send notifications. (Is it required?)
  - [ ] Build Completed: Triggered when the build is completed in CCv2 whether it is success or failure.
  - [ ] Slack: Send notifications to Slack.
  - [ ] Email: Send notifications to email.
    - [ ] SendGrid: Send notifications using SendGrid.
    - [ ] AWS SES: Send notifications using AWS SES.
    - [ ] Custom SMTP: Send notifications using custom SMTP.
    - [ ] Similar SMTP services.
  - [ ] Microsoft Teams: Send notifications to Microsoft Teams.

## Getting Started

See [action.yml](action.yml)

### Prerequisites

- GitHub repository with SAP Commerce Cloud in the Public Cloud (CCv2) project.
- SAP Commerce Cloud in the Public Cloud (CCv2) project with the required configurations.
- Webhook URL or email address(es) to send notifications.
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
      - main
      - 'release/*'
  pull_request:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v2

      - name: Trigger SAP Commerce Cloud Build
        uses: sap-cx-actions/sap-commerce-build@v1
        with:
          token: ${{ secrets.CCV2_API_TOKEN }}
          subscriptionCode: ${{ secrets.CCV2_SUBSCRIPTION_CODE }}
          branch: ${{ github.ref }}
          buildName: 'My Build'
          checkStatusInterval: 300000
          retryOnFailure: false
          maxRetries: 3
          notify: false
          destination: ''
```

### Inputs

- `token` - **Required**. SAP Commerce Cloud in the Public Cloud (CCv2) API Token.
- `subscriptionCode` - **Required**. SAP Commerce Cloud in the Public Cloud (CCv2) Subscription Code.
- `branch` - **Required**. The branch name or tag to trigger the build.
- `buildName` - **Optional**. The name of the build.
- `checkStatusInterval` - **Optional**. The interval in milliseconds to check the build status. Default is 300000 (5
  minutes).
- `retryOnFailure` - **Optional**. Retry the build if failed. Default is false.
- `maxRetries` - **Optional**. The maximum number of retries. Default is 3.
- `notify` - **Optional**. Send notifications on the build status. Default is false.
- `destination` - **Optional**. The URL or the email addresses (comma separated) to send notifications. Default is ''.

### Outputs

- `buildCode` - The build code of the triggered build.
- `buildStatus` - The status of the triggered build.
