# Self-Runners Infrastructure

A production-ready, serverless auto-scaling solution for GitHub Actions self-hosted runners on AWS. This infrastructure automatically provisions ephemeral ECS Fargate tasks to execute GitHub Actions workflows, then tears them down when complete—providing cost-effective, secure, and scalable CI/CD execution.

## 🎯 What This Project Does

This project solves the challenge of running GitHub Actions workflows at scale without maintaining persistent infrastructure. Instead of managing dedicated runner servers, this system:

- **Automatically provisions runners** when GitHub Actions workflows are queued with the `self-hosted` label
- **Executes workflows** in isolated, ephemeral containers on AWS ECS Fargate
- **Scales from zero to ten** concurrent runners based on demand
- **Automatically cleans up** runners when workflows complete
- **Monitors and alerts** on infrastructure health and performance issues

### Key Benefits

- ✅ **Zero idle costs**: No runners run when no workflows are queued
- ✅ **Auto-scaling**: Automatically handles workload spikes
- ✅ **Secure**: Webhook signature validation, IAM-based permissions, VPC isolation
- ✅ **Ephemeral**: Each runner is temporary and self-destructing
- ✅ **Docker-in-Docker**: Supports containerized workflows
- ✅ **Multi-architecture**: Supports ARM64 (with AMD64 capability)
- ✅ **Production-ready**: Comprehensive monitoring, alerting, and observability

## 🏗️ Architecture Overview

The system follows an event-driven, serverless architecture:

```
GitHub Actions Workflow
         ↓
   GitHub Webhook
         ↓
   API Gateway (HTTPS)
         ↓
   Lambda Function (Webhook Handler)
         ↓
   ┌─────────────────┐
   │ Validates       │
   │ Webhook         │
   │ Signature       │
   └─────────────────┘
         ↓
   ┌─────────────────┐
   │ Checks Redis    │
   │ for existing    │
   │ task mapping    │
   └─────────────────┘
         ↓
   ┌─────────────────┐
   │ Gets Runner     │
   │ Token from      │
   │ GitHub API      │
   └─────────────────┘
         ↓
   ┌─────────────────┐
   │ Starts ECS      │
   │ Fargate Task    │
   └─────────────────┘
         ↓
   ┌─────────────────┐
   │ Runner Executes │
   │ Workflow        │
   └─────────────────┘
         ↓
   ┌─────────────────┐
   │ Workflow        │
   │ Completes       │
   └─────────────────┘
         ↓
   ┌─────────────────┐
   │ Lambda Stops    │
   │ ECS Task        │
   └─────────────────┘
```

### Core Components

1. **API Gateway V2**: Receives GitHub webhook events via HTTPS endpoint (`actions.patientstudio.com`)
2. **Lambda Functions**:
   - `WebhookHandlerGHA`: Processes webhook events, manages ECS tasks
   - `AlarmsHandler`: Processes CloudWatch alarms and sends Slack notifications
   - `HelloHandler`: Health check endpoint
3. **ECS Fargate Cluster**: Runs GitHub Actions runners in isolated containers
4. **VPC**: Custom VPC with public/private subnets, NAT gateway for internet access
5. **Redis/Valkey Cache**: Tracks workflow-to-task ARN mappings (2-hour TTL)
6. **Secrets Manager**: Stores GitHub API tokens and webhook secrets
7. **CloudWatch**: Comprehensive monitoring, alarms, and dashboards
8. **SNS**: Alarm notifications routed to Slack

## 📋 Prerequisites

Before deploying this infrastructure, ensure you have:

- **AWS Account** with appropriate permissions for:
  - ECS, Lambda, API Gateway, VPC, Secrets Manager, CloudWatch, SNS
  - Ability to create IAM roles and policies
- **Node.js 18+** and npm installed
- **Docker** installed and running (for local development)
- **SST CLI** installed globally: `npm install -g sst`
- **AWS CLI** configured with credentials: `aws configure`
- **GitHub Repository** with Actions enabled
- **GitHub Personal Access Token** with `repo` and `admin:org` permissions
- **GitHub Webhook Secret** for validating webhook payloads

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd self-runners-infra
npm install
```

### 2. Configure AWS Secrets

Create the following secrets in AWS Secrets Manager (region: `us-east-1`):

#### GitHub Webhook Secret

```bash
aws secretsmanager create-secret \
  --name GITHUB_WEBHOOK_SECRET \
  --secret-string '{"webhook_secret":"your-github-webhook-secret-here"}'
```

#### GitHub API Token

```bash
aws secretsmanager create-secret \
  --name GITHUB_API_TOKEN \
  --secret-string '{"GITHUB_API_TOKEN":"ghp_your-personal-access-token-here"}'
```

**GitHub Token Permissions Required:**

- `repo` (Full control of private repositories)
- `admin:org` (Full control of orgs and teams, if using organization-level runners)

### 3. Deploy Infrastructure

**Production:**

```bash
npm run deploy
```

**QA/Staging:**

```bash
npm run deploy:qa
```

**Development:**

```bash
npm run dev
```

### 4. Configure GitHub Webhook

1. Go to your GitHub repository/organization settings
2. Navigate to **Settings** → **Webhooks** → **Add webhook**
3. Configure:
   - **Payload URL**: `https://actions.patientstudio.com/webhook`
   - **Content type**: `application/json`
   - **Events**: Select **"Workflow jobs"**
   - **Secret**: Use the same secret you stored in AWS Secrets Manager
4. Save the webhook

### 5. Configure DNS

The API Gateway uses a custom domain (`actions.patientstudio.com`). After deployment:

1. Retrieve the ACM certificate validation records from AWS Console
2. Add the DNS validation records to your DNS provider
3. Wait for certificate validation (can take up to 30 minutes)
4. Create a CNAME record pointing `actions.patientstudio.com` to the API Gateway domain

### 6. Test the Setup

Create a test workflow in your repository:

```yaml
name: Test Self-Hosted Runner
on: [push, pull_request]

jobs:
  test:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v4
      - name: Test Runner
        run: |
          echo "Runner is working!"
          uname -a
          docker --version
```

## ⚙️ Configuration

### Environment Variables

The following environment variables are automatically configured by SST:

- `CLUSTER_NAME`: ECS cluster name
- `SERVICE_NAME`: ECS service name
- `TASK_DEFINITION_ARN`: ECS task definition ARN
- `VPC_PUBLIC_SUBNETS`: Comma-separated list of public subnet IDs
- `SECURITY_GROUP_ID`: Security group ID for VPC
- `GITHUB_SECRET`: GitHub webhook secret (from Secrets Manager)

### ECS Runner Configuration

- **CPU**: 4 vCPU per runner
- **Memory**: 16 GB per runner
- **Storage**: 75 GB per runner
- **Architecture**: ARM64 (Amazon Linux 2023)
- **Scaling**: 0-10 concurrent runners
- **Launch Type**: Fargate
- **Max Concurrent Tasks**: 6 (hard limit to control costs)

### Docker Image

The runner container is built from `src/infra/docker/Dockerfile` and includes:

- **Base**: Amazon Linux 2023
- **GitHub Actions Runner**: v2.329.0 (latest at build time)
- **Node.js**: v16
- **Docker CLI**: For Docker-in-Docker workflows
- **AWS CLI**: For AWS service interactions
- **System Tools**: unzip, tar, jq, shadow-utils, sudo

### Network Configuration

- **VPC**: Custom VPC with public and private subnets
- **Availability Zones**: `us-east-1a`, `us-east-1b`
- **NAT Gateway**: Managed NAT for outbound internet access from private subnets
- **Security Groups**: Configured for GitHub Actions runner communication
- **Public IP**: Enabled for ECS tasks (required for GitHub connectivity)

## 🔄 How It Works

### Workflow Lifecycle

1. **Workflow Queued**: GitHub sends a `workflow_job.queued` webhook event
2. **Webhook Validation**: Lambda validates the webhook signature using HMAC-SHA256
3. **Event Processing**: Lambda checks if the workflow has the `self-hosted` label
4. **Capacity Check**: Lambda verifies current running task count (max 6)
5. **Token Generation**: Lambda requests a runner registration token from GitHub API
6. **Task Launch**: Lambda starts a new ECS Fargate task with:
   - Runner registration token
   - Repository URL
   - Unique runner name
   - Ephemeral configuration
7. **Task Mapping**: Lambda stores workflow ID → task ARN mapping in Redis (2-hour TTL)
8. **Runner Execution**: Container configures and starts the GitHub Actions runner
9. **Workflow Execution**: Runner executes the workflow steps
10. **Completion**: GitHub sends `workflow_job.completed` webhook event
11. **Cleanup**: Lambda stops the ECS task using the stored task ARN

### Supported Webhook Actions

- `queued`: Starts a new runner task
- `in_progress`: Logged (no action)
- `waiting`: Logged (no action)
- `completed`: Stops the runner task

### Organization Restriction

Currently, the system only processes webhooks from the `patient-studio` organization. This is enforced in the webhook handler for security.

## 📊 Monitoring and Observability

### CloudWatch Alarms

The system automatically creates CloudWatch alarms for all Lambda functions:

- **Errors**: Alerts when any errors occur
- **Throttles**: Alerts when Lambda is throttled
- **Duration**: Alerts when execution time exceeds 80% of timeout
- **Concurrent Executions**: Monitors concurrency levels
- **SQS Backlog**: For queue-triggered functions (if applicable)

### CloudWatch Dashboards

Automated dashboards provide visibility into:

- Lambda invocations, errors, throttles
- Execution duration (average and max)
- Concurrent executions
- Provisioned concurrency utilization
- SQS queue metrics (if applicable)

### Slack Notifications

Alarms are automatically forwarded to Slack via the `AlarmsHandler` Lambda function, providing:

- Real-time alert notifications
- Alarm state changes (ALARM → OK, OK → ALARM)
- Detailed metric information
- Direct links to CloudWatch logs

### Logs

- **Lambda Logs**: `/aws/lambda/WebhookHandlerGHA`, `/aws/lambda/AlarmsHandler`, `/aws/lambda/HelloHandler`
- **ECS Logs**: `/ecs/RunnersService` (container logs)
- **API Gateway Logs**: Available in CloudWatch

## 🔒 Security

### Webhook Security

- **HMAC-SHA256 Signature Validation**: All webhook payloads are validated
- **Secret Storage**: Webhook secrets stored in AWS Secrets Manager
- **HTTPS Only**: API Gateway enforces HTTPS with custom domain and ACM certificate

### Access Control

- **IAM Roles**: Least privilege principle for all AWS resources
- **VPC Isolation**: ECS tasks run in isolated VPC with security groups
- **Secrets Manager**: GitHub tokens stored encrypted at rest
- **Organization Restriction**: Only processes webhooks from authorized organization

### Network Security

- **Security Groups**: Restrictive egress rules (only necessary outbound traffic)
- **VPC**: Private subnets for Lambda, public subnets for ECS tasks
- **NAT Gateway**: Secure outbound internet access

## 💰 Cost Optimization

- **Scale to Zero**: No runners run when no workflows are queued
- **Ephemeral Runners**: Automatic cleanup prevents resource waste
- **Concurrent Limit**: Maximum of 6 concurrent runners to control costs
- **Fargate Spot**: Can be configured for additional cost savings (not currently enabled)
- **Resource Right-Sizing**: 4 vCPU / 16 GB per runner (optimized for typical workloads)

### Estimated Costs (us-east-1)

- **ECS Fargate**: ~\$0.04/hour per runner (4 vCPU, 16 GB)
- **Lambda**: ~\$0.20 per 1M requests (minimal usage)
- **API Gateway**: ~\$3.50 per 1M requests
- **NAT Gateway**: ~\$0.045/hour (always on)
- **CloudWatch**: ~\$0.50/GB logs ingested

**Example**: 100 workflows/month, 30 minutes average runtime = ~\$2-3/month in ECS costs

## 🐛 Troubleshooting

### Webhook Not Triggering

1. **Check webhook configuration**:

   - Verify payload URL is correct
   - Ensure webhook secret matches AWS Secrets Manager
   - Confirm "Workflow jobs" event is selected

2. **Check API Gateway**:

   - Verify DNS is configured correctly
   - Check certificate validation status
   - Review API Gateway logs in CloudWatch

3. **Check Lambda logs**:
   ```bash
   aws logs tail /aws/lambda/WebhookHandlerGHA --follow
   ```

### Runner Not Starting

1. **Check ECS permissions**:

   - Verify Lambda has `ecs:RunTask` permission
   - Check IAM role has `ecs:PassRole` permission

2. **Check VPC configuration**:

   - Verify subnets are public and have internet gateway route
   - Check security group allows outbound traffic
   - Ensure NAT gateway is operational (if using private subnets)

3. **Check ECS task logs**:
   ```bash
   aws ecs list-tasks --cluster <cluster-name>
   aws logs tail /ecs/RunnersService --follow
   ```

### Workflow Stuck

1. **Check runner status**:

   - View ECS tasks in AWS Console
   - Check CloudWatch logs for runner container
   - Verify runner can reach GitHub (network connectivity)

2. **Check Redis connectivity**:

   - Verify Lambda can connect to Redis/Valkey
   - Check workflow-to-task mapping exists

3. **Manual cleanup**:

   ```bash
   # List running tasks
   aws ecs list-tasks --cluster <cluster-name> --desired-status RUNNING

   # Stop a specific task
   aws ecs stop-task --cluster <cluster-name> --task <task-id>
   ```

### Authentication Errors

1. **GitHub API Token**:

   - Verify token has required permissions (`repo`, `admin:org`)
   - Check token hasn't expired
   - Verify secret name matches: `GITHUB_API_TOKEN`

2. **Runner Registration**:
   - Check runner token generation in Lambda logs
   - Verify repository URL is correct
   - Ensure organization/repository access is granted

### Debug Mode

Enable debug logging in the runner container by setting:

```bash
DEBUG=1
```

This enables verbose logging in the entrypoint script.

## 📚 Additional Documentation

- **[INFRASTRUCTURE.md](./INFRASTRUCTURE.md)**: Detailed technical documentation of the infrastructure components
- **[src/infra/README-monitoring.md](./src/infra/README-monitoring.md)**: Comprehensive monitoring and observability guide
- **[src/infra/docker/README.md](./src/infra/docker/README.md)**: Docker image build and configuration details

## 🛠️ Development

### Local Development

```bash
# Start SST dev environment
npm run dev

# Check for runner updates
npm run check-runner-updates

# Check runner updates and create PR
npm run check-runner-updates:pr
```

### Project Structure

```
self-runners-infra/
├── src/
│   ├── functions/          # Lambda function handlers
│   │   ├── webhook.ts      # Main webhook handler
│   │   ├── alarms.ts       # CloudWatch alarm processor
│   │   └── hello.ts        # Health check endpoint
│   ├── infra/              # Infrastructure as code
│   │   ├── api.ts          # API Gateway configuration
│   │   ├── ecs.ts          # ECS cluster and service
│   │   ├── functions.ts    # Lambda function definitions
│   │   ├── vpc.ts          # VPC and networking
│   │   ├── observability.ts # Monitoring setup
│   │   └── docker/         # Docker image build files
│   ├── lib/                # Shared libraries
│   │   ├── octokit.ts      # GitHub API client
│   │   ├── redis.ts        # Redis/Valkey client
│   │   └── secretsManager.ts # AWS Secrets Manager client
│   ├── helpers/            # Utility functions
│   │   └── cache.ts        # Redis caching utilities
│   ├── routes/             # API route definitions
│   └── validators/         # Zod schemas for validation
├── scripts/                # Utility scripts
│   └── check-runner-updates.js # GitHub Actions runner version checker
├── sst.config.ts           # SST configuration
└── package.json
```

### Testing

1. **Test webhook locally**:

   - Use `sst dev` to get local endpoint
   - Use ngrok or similar to expose local endpoint to GitHub
   - Send test webhook events

2. **Test ECS task manually**:
   ```bash
   aws ecs run-task \
     --cluster <cluster-name> \
     --task-definition <task-definition> \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[subnet-id],securityGroups=[sg-id],assignPublicIp=ENABLED}"
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly (locally and in QA environment)
5. Submit a pull request

## 📝 License

ISC License - see [package.json](./package.json) for details.

## 🆘 Support

For issues, questions, or contributions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review CloudWatch logs
3. Check GitHub Issues
4. Contact the infrastructure team

---

**Built with**: AWS (ECS, Lambda, API Gateway, VPC), SST, TypeScript, GitHub Actions Runner
