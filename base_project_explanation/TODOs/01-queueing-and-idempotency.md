# TODO: Queueing & Idempotency

## Status

✅ **Completed**

## Overview

Implement a robust queueing system with idempotency controls to prevent duplicate runner launches, handle back-pressure, and ensure reliable message processing at scale.

## Why This Matters

**Current State**: Webhook events are processed directly by Lambda, which can lead to:

- **Stampede problems**: Multiple webhooks for the same workflow causing duplicate runners
- **No back-pressure**: Lambda can be overwhelmed during traffic spikes
- **Lost messages**: No retry mechanism for failed processing
- **No deduplication**: Same workflow can trigger multiple runners

**Benefits After Implementation**:

- ✅ **Eliminate duplicate runners**: Idempotency keys prevent the same workflow from launching multiple runners
- ✅ **Smooth traffic spikes**: Queue buffers bursts and processes at controlled rate
- ✅ **Reliable processing**: DLQ captures failed messages for investigation
- ✅ **Better observability**: Queue metrics (depth, age, throughput) provide visibility
- ✅ **Cost control**: Prevent wasted resources from duplicate runners

## What to Implement

### 1. SQS FIFO Queue

Insert an SQS FIFO queue between API Gateway/Lambda and the runner launcher.

**Key Features**:

- **FIFO ordering**: Ensures workflow events are processed in order
- **Content-based deduplication**: Automatically deduplicates messages based on content
- **Message groups**: Group by repository to maintain ordering per repo
- **Visibility timeout**: Prevents message reprocessing during runner startup

**Message Structure**:

```json
{
  "workflowId": "123456",
  "repository": "patient-studio/next-gen-api",
  "ref": "refs/heads/main",
  "commitSha": "abc123...",
  "jobId": "789",
  "action": "queued",
  "webhookPayload": { ... }
}
```

**Deduplication Key**: `{repository}#{workflowId}#{jobId}`

### 2. Dead Letter Queue (DLQ)

Configure a DLQ to capture messages that fail processing after multiple retries.

**Configuration**:

- **Max receives**: 3 attempts before moving to DLQ
- **Visibility timeout**: 5 minutes (allows time for runner startup)
- **DLQ retention**: 14 days for investigation

**Monitoring**:

- Alert when DLQ receives messages (indicates systemic issues)
- Dashboard showing DLQ depth and message age

### 3. Idempotency Layer

Implement idempotency checks to prevent duplicate runner launches.

**Approach**:

- **Idempotency key**: `{repository}#{workflowId}#{jobId}#{action}`
- **Storage**: DynamoDB table with TTL (2 hours)
- **Check before launch**: Query DynamoDB to see if runner already launched
- **Write after launch**: Store idempotency key with task ARN
- **Conditional writes**: Use DynamoDB conditional writes to prevent race conditions

**Flow**:

1. Webhook received → Generate idempotency key
2. Check DynamoDB for existing key
3. If exists → Skip (already processing)
4. If not exists → Write key, launch runner
5. On completion → Key expires via TTL

### 4. Backoff & Retry Strategy

Implement exponential backoff for transient failures.

**Retry Logic**:

- **Transient errors** (throttling, temporary failures): Retry with exponential backoff
- **Permanent errors** (invalid payload, auth failures): Move to DLQ immediately
- **Max retries**: 3 attempts with backoff: 1s, 2s, 4s

### 5. Poison Message Quarantine

Detect and quarantine messages that consistently fail processing.

**Detection**:

- Track message failure count in DynamoDB
- After 3 failures → Move to quarantine table
- Alert on quarantine events

**Investigation**:

- Quarantine table includes full message payload and error details
- Manual review process to identify root cause

## Implementation Steps

1. **Create SQS FIFO Queue**

   - Queue name: `self-runners-webhook-queue.fifo`
   - Enable content-based deduplication
   - Configure DLQ

2. **Update Lambda Function**

   - Change trigger from API Gateway direct to SQS
   - Add idempotency check at start of handler
   - Implement retry logic with backoff

3. **Create DynamoDB Table**

   - Table name: `self-runners-idempotency`
   - Partition key: `idempotencyKey` (string)
   - TTL attribute: `expiresAt`
   - GSI: `workflowId` for reconciliation queries

4. **Add Monitoring**

   - CloudWatch alarms for queue depth
   - DLQ message count alarm
   - Idempotency hit/miss metrics

5. **Update Documentation**
   - Document queue architecture
   - Explain idempotency key format
   - Add troubleshooting guide for DLQ

## Success Metrics

- **Duplicate runner rate**: < 0.1% (currently unknown, measure baseline first)
- **Queue processing latency**: p95 < 5 seconds
- **DLQ message rate**: < 0.01% of total messages
- **Idempotency hit rate**: Track percentage of duplicate webhooks prevented

## Related TODOs

- [Reliability Controls](./07-reliability-controls.md) - Reconciliation job will use idempotency table
- [Observability & SLOs](./05-observability-and-slos.md) - Queue metrics feed into SLOs
- [DynamoDB Migration](./03-artifact-store-and-cache.md) - Idempotency table is first DynamoDB use case

## References

- [AWS SQS FIFO Queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues.html)
- [Idempotency Patterns](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)
- [Message Deduplication](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/using-messagededuplicationid-property.html)
