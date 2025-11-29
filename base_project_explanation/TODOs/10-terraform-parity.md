# TODO: Terraform Parity

## Status

✅ **Completed**

## Overview

Create a Terraform module that mirrors a subset of the SST/Pulumi infrastructure to demonstrate infrastructure-as-code flexibility.

## Why This Matters

**Current State**:

- Infrastructure defined only in SST/Pulumi
- Limited to one IaC tool

**Problems This Solves**:

- 🔄 **Tool flexibility**: Team may prefer Terraform
- 🔍 **Comparison**: Compare Terraform vs. Pulumi approaches

**Benefits After Implementation**:

- ✅ **Tool flexibility**: Can use either tool
- ✅ **Best of both**: Use each tool where it excels
- ✅ **Portability**: Easier to migrate if needed

## What to Implement

### 1. Terraform Module Structure

Create a Terraform module for a core subset of infrastructure.

**Module Scope** (MVP):

- API Gateway V2
- SQS FIFO Queue + DLQ
- Lambda function (webhook handler)
- IAM roles and policies
- CloudWatch alarms

**Why This Subset**:

- **Core functionality**: Represents main workflow
- **Manageable size**: Not overwhelming to maintain
- **Demonstrates skills**: Shows Terraform proficiency
- **Complementary**: Works alongside SST for other resources

**Module Structure**:

```
terraform/
├── modules/
│   └── self-runners/
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       ├── api-gateway.tf
│       ├── sqs.tf
│       ├── lambda.tf
│       ├── iam.tf
│       └── alarms.tf
├── environments/
│   ├── prod/
│   │   ├── main.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   └── qa/
│       ├── main.tf
│       ├── terraform.tfvars
│       └── backend.tf
└── README.md
```

### 2. API Gateway Module

Terraform configuration for API Gateway V2.

**Resources**:

- `aws_apigatewayv2_api`: HTTP API
- `aws_apigatewayv2_domain_name`: Custom domain
- `aws_apigatewayv2_stage`: API stage
- `aws_apigatewayv2_route`: Routes to Lambda

**Key Features**:

- Custom domain support
- ACM certificate integration
- Lambda integration
- CORS configuration (if needed)

### 3. SQS Module

Terraform configuration for SQS FIFO queue and DLQ.

**Resources**:

- `aws_sqs_queue`: FIFO queue
- `aws_sqs_queue`: Dead letter queue
- `aws_sqs_queue_policy`: Queue policies

**Key Features**:

- Content-based deduplication
- DLQ configuration
- Visibility timeout
- Message retention

### 4. Lambda Module

Terraform configuration for Lambda function.

**Resources**:

- `aws_lambda_function`: Function definition
- `aws_lambda_permission`: API Gateway permission
- `aws_lambda_event_source_mapping`: SQS trigger (if applicable)

**Key Features**:

- Deployment package (zip file)
- Environment variables
- VPC configuration
- IAM role attachment

### 5. IAM Module

Terraform configuration for IAM roles and policies.

**Resources**:

- `aws_iam_role`: Lambda execution role
- `aws_iam_role_policy`: Inline policies
- `aws_iam_role_policy_attachment`: Managed policy attachments

**Key Features**:

- Least privilege principles
- ECS permissions
- Secrets Manager permissions
- CloudWatch Logs permissions

### 6. Integration with SST

Ensure Terraform and SST can coexist.

**Approach**:

- **Separate resources**: Terraform manages subset, SST manages rest
- **Shared state**: Use remote state or data sources to reference
- **No conflicts**: Ensure resource names don't conflict

**State Management**:

- **Terraform**: S3 backend for state
- **SST**: Pulumi state (managed by SST)
- **Cross-references**: Use data sources to reference SST resources

### 7. Documentation

Document Terraform module usage and comparison.

**Documentation**:

- **README**: Module usage, variables, outputs
- **Comparison**: Terraform vs. Pulumi/SST approach
- **Migration guide**: How to migrate resources between tools
- **Best practices**: When to use Terraform vs. SST

## Implementation Steps

1. **Create Module Structure**

   - Set up Terraform directory structure
   - Create module skeleton
   - Add basic files

2. **Implement API Gateway**

   - Define API Gateway resources
   - Add custom domain
   - Configure routes

3. **Implement SQS**

   - Define FIFO queue
   - Define DLQ
   - Configure policies

4. **Implement Lambda**

   - Define Lambda function
   - Configure triggers
   - Set up IAM

5. **Add IAM**

   - Define roles
   - Create policies
   - Attach to Lambda

6. **Add Alarms**

   - CloudWatch alarms
   - SNS topics
   - Alarm actions

7. **Test Integration**

   - Deploy alongside SST
   - Verify no conflicts
   - Test functionality

8. **Documentation**
   - Write README
   - Add examples
   - Document comparison

## Success Metrics

- **Module completeness**: All core resources defined
- **Functionality**: Works alongside SST infrastructure
- **Documentation**: Clear usage instructions
- **Comparison**: Helpful Terraform vs. Pulumi comparison

## Example Terraform Usage

```hcl
module "self_runners" {
  source = "./modules/self-runners"

  environment = "prod"
  domain_name = "actions.patientstudio.com"

  lambda_handler = "src/functions/webhook.handler"
  lambda_runtime = "nodejs22.x"

  sqs_queue_name = "self-runners-webhook-queue.fifo"

  tags = {
    Environment = "prod"
    ManagedBy   = "terraform"
  }
}
```

## Related TODOs

- [Queueing & Idempotency](./01-queueing-and-idempotency.md) - SQS module implements this
- [Observability & SLOs](./05-observability-and-slos.md) - Alarms module implements this

## References

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Terraform Modules](https://www.terraform.io/docs/language/modules/index.html)
- [Terraform Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/index.html)
