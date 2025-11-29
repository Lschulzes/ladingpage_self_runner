# TODO: Reliability Controls

## Status

✅ **Completed**

## Overview

Implement reconciliation jobs and exactly-once cleanup semantics to ensure no orphaned runners, prevent resource leaks, and maintain system reliability at scale.

## Why This Matters

**Current State**:

- No reconciliation mechanism (orphaned runners can exist indefinitely)
- No exactly-once guarantees for cleanup
- Race conditions possible during task stop operations
- No visibility into orphaned resources

**Problems This Solves**:

- 💸 **Resource leaks**: Orphaned runners continue running and costing money
- 🔄 **Race conditions**: Multiple cleanup attempts can conflict
- 📊 **No visibility**: Can't detect or measure orphaned resources
- ⚠️ **Manual intervention**: Requires manual cleanup when issues occur

**Benefits After Implementation**:

- ✅ **Zero orphaned runners**: Automatic detection and cleanup
- ✅ **Exactly-once cleanup**: Idempotent operations prevent conflicts
- ✅ **Cost control**: Prevent wasted spend on orphaned resources
- ✅ **Reliability**: System self-heals from edge cases
- ✅ **Observability**: Metrics on orphan rate and reconciliation success

## What to Implement

### 1. Reconciliation Job

Periodic job to find and clean up orphaned runners.

**What is an Orphaned Runner?**:

- ECS task is running but workflow has completed
- ECS task is running but workflow ID not found in GitHub
- ECS task running longer than expected (e.g., > 2 hours)
- Workflow-to-task mapping exists but task doesn't exist

**Reconciliation Algorithm**:

1. **Query DynamoDB**: Get all active workflow-to-task mappings
2. **Query ECS**: Get all running tasks in cluster
3. **Query GitHub API**: Get workflow status for each workflow ID
4. **Compare**:
   - Task exists but workflow completed → Orphan (stop task)
   - Task exists but workflow not found → Orphan (stop task)
   - Task running > 2 hours → Potential orphan (investigate)
   - Mapping exists but task doesn't → Stale mapping (cleanup)

**Reconciliation Frequency**:

- **Every 5 minutes**: Quick check for obvious orphans
- **Every 30 minutes**: Full reconciliation scan
- **On-demand**: Manual trigger via API

### 2. Exactly-Once Cleanup Semantics

Ensure cleanup operations are idempotent and race-condition free.

**Problem**: Multiple cleanup attempts (webhook + reconciliation) can conflict.

**Solution**: Use DynamoDB conditional writes for atomic operations.

**Cleanup Flow**:

1. **Read task mapping**: Get workflow ID → task ARN from DynamoDB
2. **Conditional write**: Update mapping with `status: "cleaning"` (only if `status: "active"`)
3. **If write succeeds**: We own the cleanup, proceed
4. **If write fails**: Another process is cleaning, skip
5. **Stop task**: Call ECS StopTask
6. **Update mapping**: Set `status: "cleaned"` and `cleanedAt: timestamp`

**DynamoDB Schema**:

```json
{
  "workflowId": "123456",
  "taskArn": "arn:aws:ecs:...",
  "status": "active|cleaning|cleaned",
  "createdAt": "2024-01-01T00:00:00Z",
  "cleanedAt": "2024-01-01T01:00:00Z",
  "ttl": 1735689600
}
```

**Conditional Write Example**:

```typescript
await dynamodb.update({
  Key: { workflowId: '123456' },
  UpdateExpression: 'SET #status = :cleaning',
  ConditionExpression: '#status = :active',
  ExpressionAttributeNames: { '#status': 'status' },
  ExpressionAttributeValues: { ':active': 'active', ':cleaning': 'cleaning' },
})
```

### 3. Orphan Detection Logic

Detect orphaned runners using multiple heuristics.

**Heuristic 1: Workflow Completed but Task Running**

- Check GitHub API for workflow status
- If `conclusion: "success"|"failure"|"cancelled"` and task still running → Orphan

**Heuristic 2: Task Running Too Long**

- If task running > 2 hours → Potential orphan
- Check if workflow is still active in GitHub
- If workflow completed but task still running → Orphan

**Heuristic 3: Stale Mapping**

- Mapping exists in DynamoDB but task doesn't exist in ECS
- Cleanup stale mapping

**Heuristic 4: Task in Bad State**

- Task status: `STOPPED` but mapping still `active`
- Task status: `FAILED` but workflow still `queued`
- Cleanup inconsistent state

### 4. Reconciliation Lambda Function

Scheduled Lambda function to run reconciliation.

**Schedule**: CloudWatch Events (EventBridge) every 30 minutes

**Function Logic**:

1. Query DynamoDB for active mappings
2. Query ECS for running tasks
3. Query GitHub API for workflow statuses (batch)
4. Identify orphans using heuristics
5. Cleanup orphans (with exactly-once semantics)
6. Emit metrics: orphans found, cleaned, errors

**Error Handling**:

- **Transient errors**: Retry with exponential backoff
- **Permanent errors**: Log and alert, continue with other orphans
- **Rate limiting**: Back off and retry later

### 5. Metrics & Alerting

Track orphan rate and reconciliation success.

**Metrics**:

- `OrphanedRunnersDetected`: Count of orphans found
- `OrphanedRunnersCleaned`: Count of orphans cleaned
- `OrphanedRunnerRate`: Percentage of runners that become orphaned
- `ReconciliationErrors`: Count of reconciliation failures
- `ReconciliationDuration`: Time to run reconciliation

**Alarms**:

- **High orphan rate**: > 0.1% of runners become orphaned
- **Reconciliation failures**: > 5 failures in 1 hour
- **Orphans not cleaned**: Orphans detected but not cleaned within 10 minutes

**Dashboards**:

- Orphan rate over time
- Reconciliation job success rate
- Orphan cleanup latency
- Top repositories by orphan rate (if applicable)

### 6. Manual Cleanup API

API endpoint for manual orphan cleanup and investigation.

**Endpoints**:

- `GET /admin/orphans`: List current orphaned runners
- `POST /admin/orphans/{workflowId}/cleanup`: Manually cleanup specific orphan
- `POST /admin/reconciliation/run`: Trigger reconciliation job on-demand

**Response Format**:

```json
{
  "orphans": [
    {
      "workflowId": "123456",
      "taskArn": "arn:aws:ecs:...",
      "detectedAt": "2024-01-01T00:00:00Z",
      "reason": "workflow_completed_but_task_running",
      "workflowStatus": "success",
      "taskStatus": "RUNNING"
    }
  ],
  "total": 1
}
```

### 7. Graceful Task Shutdown

Ensure tasks shut down gracefully to prevent data loss.

**Current Issue**: `ecs:StopTask` immediately terminates container (SIGKILL)

**Solution**: Implement graceful shutdown in runner entrypoint.

**Graceful Shutdown Flow**:

1. **SIGTERM received**: Runner receives termination signal
2. **Finish current step**: Complete current workflow step (if possible)
3. **Cleanup**: Remove runner registration, save state
4. **Exit**: Container exits cleanly

**ECS Stop Behavior**:

- Use `stopTimeout: 30` seconds in task definition
- ECS sends SIGTERM, waits 30 seconds, then SIGKILL
- Runner entrypoint handles SIGTERM gracefully

## Implementation Steps

1. **Create DynamoDB Table**

   - Table: `self-runners-workflow-mappings`
   - Partition key: `workflowId` (string)
   - Attributes: `taskArn`, `status`, `createdAt`, `cleanedAt`
   - TTL: `ttl` attribute (2 hours)

2. **Migrate from Redis to DynamoDB**

   - Update `storeWorkflowTaskArn` to use DynamoDB
   - Update `getWorkflowTaskArn` to use DynamoDB
   - Keep Redis for other use cases (if needed)

3. **Create Reconciliation Lambda**

   - Function: `ReconciliationJob`
   - Schedule: EventBridge every 30 minutes
   - Handler: `src/functions/reconciliation.handler`
   - Permissions: ECS, DynamoDB, GitHub API

4. **Implement Exactly-Once Cleanup**

   - Update cleanup logic to use conditional writes
   - Add status field to mappings
   - Handle race conditions gracefully

5. **Add Orphan Detection**

   - Implement heuristics in reconciliation job
   - Query GitHub API for workflow status
   - Compare ECS tasks vs DynamoDB mappings

6. **Add Metrics & Alarms**

   - CloudWatch metrics for orphan rate
   - Alarms for high orphan rate
   - Dashboards for reconciliation status

7. **Create Admin API**

   - Add endpoints for orphan management
   - Add authentication/authorization
   - Document API usage

8. **Update Runner Entrypoint**
   - Handle SIGTERM gracefully
   - Complete current step before exit
   - Update task definition with stopTimeout

## Success Metrics

- **Orphan rate**: < 0.1% of runners become orphaned
- **Reconciliation success**: > 99% of reconciliations succeed
- **Cleanup latency**: < 5 minutes from detection to cleanup
- **Zero manual interventions**: System self-heals without manual cleanup

## Example Reconciliation Output

```
Reconciliation Job - 2024-01-01T00:00:00Z
─────────────────────────────────────────
Active mappings: 5
Running tasks: 5
Orphans detected: 0
Stale mappings: 0
Cleanup operations: 0
Duration: 1.2s
Status: ✅ Success
```

## Related TODOs

- [Queueing & Idempotency](./01-queueing-and-idempotency.md) - Idempotency table can be used for cleanup
- [Observability & SLOs](./05-observability-and-slos.md) - Orphan rate is an SLO
- [Artifact Store & Cache](./03-artifact-store-and-cache.md) - DynamoDB migration starts here

## References

- [Exactly-Once Processing](https://aws.amazon.com/builders-library/implementing-distributed-prime-number-generation-with-lambda-part-2/)
- [DynamoDB Conditional Writes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ConditionExpressions.html)
- [ECS Task Lifecycle](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_life_cycle.html)
- [Reconciliation Patterns](https://aws.amazon.com/builders-library/reconciliation-in-distributed-systems/)
