# TODO: Reusable GitHub Action

## Status

✅ **Completed**

## Overview

Package the self-runners infrastructure as a standalone, reusable GitHub Action that can be easily integrated into any repository or organization. This will allow teams to deploy their own self-hosted runner infrastructure with minimal configuration by simply referencing the action in their workflows.

## Why This Matters

**Current State**:

- Infrastructure is tightly coupled to the `patient-studio/self-runners-infra` repository
- Deployment requires cloning, configuring, and understanding the entire codebase
- Each organization/repository needs to set up the infrastructure from scratch
- Configuration is embedded in code rather than exposed as parameters

**Problems This Solves**:

- 🚀 **Easy adoption**: Teams can use self-hosted runners without deep infrastructure knowledge
- ⚙️ **Configuration flexibility**: Expose all key settings as action inputs
- 🔄 **Versioning**: Semantic versioning allows teams to pin to stable versions
- 📦 **Reusability**: Single action can be used across multiple repositories/organizations
- 🛠️ **Maintainability**: Centralized updates benefit all users

**Benefits After Implementation**:

- ✅ **One-step deployment**: Single action call deploys entire infrastructure
- ✅ **Environment-specific configs**: Support multiple environments (dev, staging, prod)
- ✅ **Version control**: Teams can pin to specific versions for stability
- ✅ **Documentation**: Clear usage examples and parameter documentation
- ✅ **Community adoption**: Easier for external teams to adopt the solution

## What to Implement

### 1. Action Metadata Structure

Create the standard GitHub Action structure with proper metadata.

**Directory Structure**:

```
.github/
├── workflows/
│   └── deploy-action.yml      # CI/CD for the action itself
action.yml                      # Action metadata and inputs
README-action.md                # Action-specific documentation
```

**Action Metadata (`action.yml`)**:

```yaml
name: 'Self Runners Infrastructure Deployment'
description: 'Deploy auto-scaling self-hosted GitHub Actions runners on AWS'
author: 'Patient Studio'
branding:
  icon: 'server'
  color: 'orange'

inputs:
  aws-region:
    description: 'AWS region for infrastructure deployment'
    required: true
    default: 'us-east-1'

  environment:
    description: 'Environment name (dev, staging, prod)'
    required: true
    default: 'dev'

  github-org:
    description: 'GitHub organization name (for webhook filtering)'
    required: true

  github-webhook-secret-name:
    description: 'AWS Secrets Manager secret name for GitHub webhook secret'
    required: true
    default: 'GITHUB_WEBHOOK_SECRET'

  github-api-token-secret-name:
    description: 'AWS Secrets Manager secret name for GitHub API token'
    required: true
    default: 'GITHUB_API_TOKEN'

  domain-name:
    description: 'Custom domain name for API Gateway (e.g., actions.example.com)'
    required: false

  cluster-name:
    description: 'ECS cluster name'
    required: false
    default: 'self-runners-cluster'

  max-concurrent-runners:
    description: 'Maximum number of concurrent runners'
    required: false
    default: '6'

  runner-cpu:
    description: 'CPU units per runner (1024 = 1 vCPU)'
    required: false
    default: '4096'

  runner-memory:
    description: 'Memory per runner in MB'
    required: false
    default: '16384'

  runner-storage:
    description: 'Ephemeral storage per runner in GB'
    required: false
    default: '75'

  vpc-cidr:
    description: 'CIDR block for VPC (e.g., 10.0.0.0/16)'
    required: false
    default: '10.0.0.0/16'

  enable-monitoring:
    description: 'Enable CloudWatch monitoring and alarms'
    required: false
    default: 'true'

  slack-webhook-url-secret-name:
    description: 'AWS Secrets Manager secret name for Slack webhook URL (optional)'
    required: false

  tags:
    description: 'Additional AWS resource tags (JSON object)'
    required: false
    default: '{}'

outputs:
  api-endpoint:
    description: 'API Gateway endpoint URL'

  webhook-url:
    description: 'Webhook URL to configure in GitHub'

  cluster-arn:
    description: 'ECS cluster ARN'

  task-definition-arn:
    description: 'ECS task definition ARN'

runs:
  using: 'composite'
  steps:
    - name: Deploy Self Runners Infrastructure
      shell: bash
      run: |
        # Action implementation
```

### 2. Action Implementation

The action will orchestrate the deployment of the infrastructure.

**Core Steps**:

1. **Validate Inputs**: Check all required parameters are provided
2. **Check Prerequisites**: Verify AWS credentials, SST CLI, Node.js
3. **Configure Environment**: Set up environment-specific configuration
4. **Deploy Infrastructure**: Run SST deployment with provided parameters
5. **Output Results**: Return API endpoint, webhook URL, and resource ARNs

**Implementation Approach**:

- **Composite Action**: Use `composite` action type to run shell scripts
- **SST Integration**: Call SST CLI with environment variables
- **Configuration Generation**: Generate `sst.config.ts` or use environment variables
- **Secrets Validation**: Verify required secrets exist in AWS Secrets Manager
- **DNS Validation**: Provide instructions for DNS setup if custom domain used

### 3. Configuration Management

Handle environment-specific and user-provided configurations.

**Configuration Sources**:

1. **Action Inputs**: User-provided parameters
2. **Environment Variables**: AWS credentials, region, etc.
3. **Secrets Manager**: GitHub tokens, webhook secrets
4. **Default Values**: Sensible defaults for optional parameters

**Configuration Flow**:

```
Action Inputs
    ↓
Validate & Merge with Defaults
    ↓
Generate SST Config (or use env vars)
    ↓
Deploy via SST CLI
    ↓
Capture Outputs
```

### 4. Environment Support

Support multiple deployment environments with isolated configurations.

**Environment Types**:

- **Development**: Lower resource limits, shorter retention
- **Staging**: Production-like but with test data
- **Production**: Full resources, monitoring, retention

**Environment Isolation**:

- Separate AWS accounts or regions (recommended)
- Resource naming with environment prefix
- Environment-specific secrets
- Isolated VPCs per environment

### 5. Versioning Strategy

Implement semantic versioning for the action.

**Versioning Approach**:

- **Major versions**: Breaking changes (infrastructure changes)
- **Minor versions**: New features, backward compatible
- **Patch versions**: Bug fixes, documentation updates

**Version Tags**:

- `v1`, `v2`: Major version tags (point to latest minor)
- `v1.0`, `v1.1`: Minor version tags (point to latest patch)
- `v1.0.0`, `v1.0.1`: Specific patch versions

**Release Process**:

1. Create release branch
2. Update version in `action.yml`
3. Create git tag
4. Push tag to trigger release workflow
5. Update `README-action.md` with changelog

### 6. Documentation

Comprehensive documentation for action users.

**Documentation Components**:

1. **README-action.md**: Usage guide, examples, parameters
2. **Examples**: Common use cases and configurations
3. **Troubleshooting**: Common issues and solutions
4. **Migration Guide**: How to migrate from manual deployment
5. **Changelog**: Version history and breaking changes

**Example Documentation Structure**:

````markdown
# Self Runners Infrastructure Action

## Quick Start

```yaml
- name: Deploy Self Runners
  uses: patient-studio/self-runners-infra@v1
  with:
    aws-region: us-east-1
    environment: prod
    github-org: my-org
    github-webhook-secret-name: GITHUB_WEBHOOK_SECRET
    github-api-token-secret-name: GITHUB_API_TOKEN
```
````

## Inputs

[Detailed input documentation]

## Outputs

[Output documentation]

## Examples

[Multiple examples for different scenarios]

````

### 7. CI/CD for the Action

Automate testing and release of the action itself.

**Workflow Requirements**:

- **Linting**: Validate action.yml syntax
- **Testing**: Test action in different scenarios
- **Versioning**: Automated version bumping
- **Release**: Create releases on version tags
- **Documentation**: Validate documentation completeness

**Test Scenarios**:

1. **Dry-run deployment**: Validate configuration without deploying
2. **Minimal config**: Test with only required inputs
3. **Full config**: Test with all optional inputs
4. **Multi-environment**: Test dev, staging, prod configs
5. **Error handling**: Test invalid inputs, missing secrets

### 8. Security Considerations

Ensure secure handling of sensitive data.

**Security Requirements**:

- **No secrets in logs**: Mask all secrets in action output
- **IAM permissions**: Document minimum required permissions
- **Secret validation**: Verify secrets exist before deployment
- **Input sanitization**: Validate and sanitize all user inputs
- **Audit logging**: Log all deployments for audit purposes

**IAM Policy Template**:

Provide a minimal IAM policy that users can attach:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecs:*",
        "lambda:*",
        "apigateway:*",
        "secretsmanager:GetSecretValue",
        "cloudwatch:*",
        "logs:*",
        "iam:PassRole",
        "iam:CreateRole",
        "iam:AttachRolePolicy"
      ],
      "Resource": "*"
    }
  ]
}
````

## Implementation Steps

1. **Create Action Structure**

   - Create `action.yml` with all inputs and outputs
   - Set up directory structure
   - Add action branding

2. **Implement Core Logic**

   - Create deployment script
   - Add input validation
   - Implement SST deployment call
   - Add output capture

3. **Add Configuration Management**

   - Create config generation logic
   - Add environment variable mapping
   - Implement defaults handling

4. **Create Documentation**

   - Write `README-action.md`
   - Add usage examples
   - Document all inputs/outputs
   - Create troubleshooting guide

5. **Set Up CI/CD**

   - Create action test workflow
   - Add linting and validation
   - Set up release automation
   - Add version management

6. **Security Hardening**

   - Add secret masking
   - Create IAM policy template
   - Add input sanitization
   - Implement audit logging

7. **Testing**

   - Test in isolated AWS account
   - Test all input combinations
   - Test error scenarios
   - Validate outputs

8. **Release**

   - Create initial v1.0.0 release
   - Tag and publish
   - Update main README with action link
   - Announce to community

## Usage Examples

### Basic Usage

```yaml
name: Deploy Self Runners Infrastructure

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        type: choice
        options:
          - dev
          - staging
          - prod

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1

      - name: Deploy Self Runners
        uses: patient-studio/self-runners-infra@v1
        with:
          aws-region: us-east-1
          environment: ${{ github.event.inputs.environment }}
          github-org: my-organization
          github-webhook-secret-name: GITHUB_WEBHOOK_SECRET
          github-api-token-secret-name: GITHUB_API_TOKEN
          max-concurrent-runners: '10'

      - name: Configure GitHub Webhook
        run: |
          echo "Webhook URL: ${{ steps.deploy.outputs.webhook-url }}"
          echo "Configure this URL in GitHub repository/organization settings"
```

### Advanced Usage with Custom Domain

```yaml
- name: Deploy Self Runners with Custom Domain
  uses: patient-studio/self-runners-infra@v1
  with:
    aws-region: us-east-1
    environment: prod
    github-org: my-organization
    github-webhook-secret-name: GITHUB_WEBHOOK_SECRET
    github-api-token-secret-name: GITHUB_API_TOKEN
    domain-name: actions.mycompany.com
    max-concurrent-runners: '20'
    runner-cpu: '8192'
    runner-memory: '32768'
    enable-monitoring: 'true'
    slack-webhook-url-secret-name: SLACK_WEBHOOK_URL
    tags: '{"Environment":"prod","Team":"Platform","CostCenter":"Engineering"}'
```

### Multi-Environment Deployment

```yaml
name: Deploy to All Environments

on:
  push:
    branches: [main]

jobs:
  deploy-dev:
    runs-on: ubuntu-latest
    environment: dev
    steps:
      - uses: patient-studio/self-runners-infra@v1
        with:
          aws-region: us-east-1
          environment: dev
          github-org: my-organization
          github-webhook-secret-name: GITHUB_WEBHOOK_SECRET_DEV
          github-api-token-secret-name: GITHUB_API_TOKEN_DEV
          max-concurrent-runners: '3'

  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
    needs: deploy-dev
    steps:
      - uses: patient-studio/self-runners-infra@v1
        with:
          aws-region: us-east-1
          environment: staging
          github-org: my-organization
          github-webhook-secret-name: GITHUB_WEBHOOK_SECRET_STAGING
          github-api-token-secret-name: GITHUB_API_TOKEN_STAGING
          max-concurrent-runners: '6'

  deploy-prod:
    runs-on: ubuntu-latest
    environment: prod
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: patient-studio/self-runners-infra@v1
        with:
          aws-region: us-east-1
          environment: prod
          github-org: my-organization
          github-webhook-secret-name: GITHUB_WEBHOOK_SECRET_PROD
          github-api-token-secret-name: GITHUB_API_TOKEN_PROD
          max-concurrent-runners: '20'
          enable-monitoring: 'true'
```

## Success Metrics

- **Adoption rate**: Number of repositories/organizations using the action
- **Deployment success rate**: Percentage of successful deployments
- **Time to deploy**: Average time from action call to infrastructure ready
- **Documentation clarity**: User feedback on documentation quality
- **Issue resolution**: Time to resolve user-reported issues

## Related TODOs

- [Terraform Parity](./10-terraform-parity.md) - Could provide Terraform alternative to action
- [Observability & SLOs](./05-observability-and-slos.md) - Action should expose observability configs
- [Security & Supply Chain](./07-security-and-supply-chain.md) - Action security best practices
- [Multi-Region Design](./08-multi-region-design.md) - Action could support multi-region deployments

## Open Questions

1. **SST vs Terraform**: Should the action use SST (current) or provide Terraform option?
2. **State Management**: How should users manage SST/Pulumi state? S3 backend?
3. **Updates**: How should users update deployed infrastructure? Re-run action?
4. **Rollback**: Should the action support rollback to previous versions?
5. **Cost Estimation**: Should the action provide cost estimates before deployment?
6. **Multi-Account**: How to support deployments across multiple AWS accounts?
7. **Custom Resources**: Should users be able to extend with custom resources?

## References

- [GitHub Actions Metadata Syntax](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions)
- [Creating Composite Actions](https://docs.github.com/en/actions/creating-actions/creating-a-composite-action)
- [Action Versioning](https://docs.github.com/en/actions/creating-actions/about-actions#using-release-management-for-actions)
- [SST Documentation](https://docs.sst.dev/)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
