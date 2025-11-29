# TODO: Observability & SLOs

## Status

✅ **Completed**

## Overview

Implement comprehensive observability with Service Level Objectives (SLOs), correlation IDs for request tracing, and advanced dashboards to monitor system health and performance at scale.

## Why This Matters

**Current State**:

- Basic CloudWatch alarms exist
- No SLOs defined or tracked
- No correlation IDs (can't trace request across services)
- Limited visibility into system behavior
- No error budgets or reliability targets

**Problems This Solves**:

- 🔍 **Poor debugging**: Can't trace a webhook through the entire system
- 📊 **No reliability targets**: Don't know if system meets requirements
- ⚠️ **Reactive alerts**: Only know about issues after they happen
- 📈 **No trends**: Can't see if system is degrading over time

**Benefits After Implementation**:

- ✅ **End-to-end tracing**: Follow a request from webhook to runner completion
- ✅ **SLO-based alerting**: Alert on reliability, not just errors
- ✅ **Proactive monitoring**: Detect degradation before users notice
- ✅ **Data-driven decisions**: Metrics guide optimization efforts
- ✅ **Error budgets**: Clear targets for reliability vs feature velocity

## What to Implement

### 1. Correlation IDs

Add unique correlation IDs to trace requests across all services.

**Correlation ID Flow**:

1. **Webhook received**: Generate correlation ID (UUID v4)
2. **API Gateway**: Add `X-Correlation-ID` header
3. **Lambda**: Extract and log correlation ID in all log statements
4. **SQS**: Include correlation ID in message attributes
5. **ECS Task**: Pass correlation ID as environment variable
6. **Runner logs**: Include correlation ID in all log output

**Implementation**:

- **API Gateway**: Custom authorizer or Lambda@Edge to inject header
- **Lambda**: Middleware to extract and propagate correlation ID
- **ECS**: Environment variable `CORRELATION_ID`
- **Logging**: Structured logging with correlation ID field

**Log Format**:

```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "level": "info",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "service": "WebhookHandlerGHA",
  "message": "Starting runner task",
  "workflowId": "123456",
  "repository": "patient-studio/next-gen-api"
}
```

### 2. Service Level Objectives (SLOs)

Define and track SLOs for key system behaviors.

**SLO Definitions**:

1. **Queueing Latency SLO**

   - **Target**: p95 queueing latency < 5 seconds
   - **Measurement**: Time from webhook received to runner started
   - **Error budget**: 99.9% success rate (0.1% can exceed 5s)

2. **Cache Hit Rate SLO**

   - **Target**: Cache hit rate > 60%
   - **Measurement**: Percentage of builds that hit cache
   - **Error budget**: 95% of time (5% can be below 60%)

3. **Deploy Success Rate SLO**

   - **Target**: 99.5% of workflows complete successfully
   - **Measurement**: (Successful workflows) / (Total workflows)
   - **Error budget**: 0.5% failure rate

4. **Orphaned Runner Rate SLO**

   - **Target**: < 0.1% of runners become orphaned
   - **Measurement**: (Orphaned runners) / (Total runners)
   - **Error budget**: 0.1% orphan rate

5. **API Availability SLO**
   - **Target**: 99.9% uptime
   - **Measurement**: (Successful requests) / (Total requests)
   - **Error budget**: 0.1% downtime (43 minutes/month)

**SLO Tracking**:

- **CloudWatch Metrics**: Custom metrics for each SLO
- **CloudWatch Insights**: Queries to calculate SLO compliance
- **Dashboards**: Real-time SLO status and error budget burn rate
- **Alarms**: Alert when error budget consumed > 50%

### 3. Error Budgets

Track error budgets for each SLO and alert when budgets are at risk.

**Error Budget Calculation**:

```
Error Budget = (1 - SLO Target) × Time Period
Example: 99.9% uptime SLO = 0.1% error budget = 43 minutes/month
```

**Error Budget Tracking**:

- **Burn rate**: How quickly error budget is consumed
- **Remaining budget**: Error budget remaining in current period
- **Projection**: Forecast when budget will be exhausted

**Alerting**:

- **Warning**: Error budget consumed > 50%
- **Critical**: Error budget consumed > 80%
- **Exhausted**: Error budget consumed = 100%

### 4. Advanced Dashboards

Create comprehensive dashboards for system observability.

**Dashboard 1: System Overview**

- Request rate (webhooks/minute)
- Queue depth
- Active runners
- Cache hit rate
- Error rate
- SLO status (all SLOs)

**Dashboard 2: Request Tracing**

- Correlation ID search
- Request timeline (webhook → queue → runner → completion)
- Latency breakdown (queue time, runner startup, execution)
- Error locations (where failures occur)

**Dashboard 3: SLO & Error Budgets**

- SLO compliance over time
- Error budget burn rate
- Remaining error budget
- SLO violations (when and why)

**Dashboard 4: Performance Trends**

- p50/p95/p99 latencies over time
- Cache hit rate trends
- Build time trends (cache hit vs miss)
- Cost per build trends

**Dashboard 5: Reliability**

- MTTR (Mean Time To Recovery)
- Orphaned runner rate
- Failed workflow rate
- Reconciliation job success rate

### 5. Distributed Tracing

Implement distributed tracing across services.

**Trace Structure**:

```
Webhook (API Gateway)
  └─> Lambda Handler
      └─> SQS Send
          └─> Queue Processing
              └─> ECS Task Start
                  └─> Runner Execution
                      └─> Workflow Steps
                          └─> Completion
```

**Trace Data**:

- **Spans**: Each service operation
- **Timing**: Duration of each span
- **Metadata**: Correlation ID, workflow ID, repository
- **Errors**: Error details at each span

**Storage**: CloudWatch X-Ray or custom trace storage

### 6. Structured Logging

Implement structured logging across all services.

**Log Schema**:

```json
{
  "timestamp": "ISO 8601",
  "level": "info|warn|error|debug",
  "correlationId": "UUID",
  "service": "service-name",
  "message": "human-readable message",
  "metadata": {
    "workflowId": "123456",
    "repository": "org/repo",
    "action": "queued|completed",
    "duration": 1234,
    "error": { ... }
  }
}
```

**Log Aggregation**:

- **CloudWatch Logs**: Centralized log storage
- **CloudWatch Insights**: Query logs by correlation ID
- **Log Groups**: Separate groups per service

### 7. Custom Metrics

Emit custom CloudWatch metrics for business logic.

**Metrics to Emit**:

1. **Queue Metrics**:

   - `QueueDepth`: Current queue depth
   - `QueueAge`: Age of oldest message
   - `QueueProcessingRate`: Messages processed per second

2. **Runner Metrics**:

   - `RunnersActive`: Current active runners
   - `RunnersStarted`: Runners started (counter)
   - `RunnersCompleted`: Runners completed (counter)
   - `RunnerStartupTime`: Time to start runner (histogram)
   - `RunnerExecutionTime`: Time to execute workflow (histogram)

3. **Cache Metrics**:

   - `CacheHits`: Cache hits (counter)
   - `CacheMisses`: Cache misses (counter)
   - `CacheHitRate`: Calculated: hits / (hits + misses)
   - `CacheSize`: Total cache size in bytes

4. **SLO Metrics**:
   - `SLOQueueLatencyP95`: p95 queue latency
   - `SLOCacheHitRate`: Current cache hit rate
   - `SLODeplySuccessRate`: Deploy success rate
   - `SLOOrphanRate`: Orphaned runner rate

## Implementation Steps

1. **Add Correlation ID Middleware**

   - API Gateway: Custom authorizer or Lambda@Edge
   - Lambda: Middleware to extract/propagate correlation ID
   - ECS: Environment variable injection

2. **Implement Structured Logging**

   - Create logging library: `src/lib/logger.ts`
   - Update all Lambda functions to use structured logging
   - Update runner entrypoint to include correlation ID

3. **Create SLO Tracking**

   - CloudWatch custom metrics for each SLO
   - CloudWatch Insights queries to calculate compliance
   - Lambda function to compute SLO status (runs every 5 minutes)

4. **Build Dashboards**

   - CloudWatch dashboards for each SLO
   - System overview dashboard
   - Request tracing dashboard

5. **Add Error Budget Alarms**

   - CloudWatch alarms for error budget consumption
   - SNS notifications when budgets at risk

6. **Implement Distributed Tracing**

   - Add X-Ray SDK to Lambda functions
   - Add X-Ray daemon to ECS tasks (optional)
   - Create trace visualization

7. **Documentation**
   - SLO definitions and targets
   - How to use correlation IDs for debugging
   - Dashboard interpretation guide

## Success Metrics

- **SLO Compliance**: > 99% of time for all SLOs
- **Error Budget Utilization**: < 50% consumed per month
- **MTTR**: < 15 minutes (mean time to recovery)
- **Trace Coverage**: 100% of requests have correlation IDs
- **Dashboard Usage**: Team uses dashboards for debugging

## Example SLO Dashboard

```
┌─────────────────────────────────────────────────┐
│ SLO Status                                      │
├─────────────────────────────────────────────────┤
│ Queue Latency (p95 < 5s):     ✅ 99.2%          │
│ Cache Hit Rate (> 60%):       ✅ 72.3%          │
│ Deploy Success (> 99.5%):     ✅ 99.7%          │
│ Orphan Rate (< 0.1%):         ✅ 0.03%          │
│ API Availability (> 99.9%):    ✅ 99.95%         │
├─────────────────────────────────────────────────┤
│ Error Budgets (This Month)                      │
├─────────────────────────────────────────────────┤
│ Queue Latency:      ████░░░░░░ 40% consumed     │
│ Cache Hit Rate:     ██░░░░░░░░ 20% consumed     │
│ Deploy Success:      █░░░░░░░░░ 10% consumed    │
│ Orphan Rate:        ░░░░░░░░░░  0% consumed    │
│ API Availability:   ██░░░░░░░░ 20% consumed     │
└─────────────────────────────────────────────────┘
```

## Related TODOs

- [Queueing & Idempotency](./01-queueing-and-idempotency.md) - Queue metrics feed into SLOs
- [Artifact Store & Cache](./03-artifact-store-and-cache.md) - Cache metrics feed into SLOs
- [Reliability Controls](./07-reliability-controls.md) - Orphan rate SLO

## References

- [Google SRE Book: SLOs](https://sre.google/workbook/slo-document/)
- [AWS X-Ray](https://aws.amazon.com/xray/)
- [CloudWatch Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/AnalyzingLogData.html)
- [Error Budgets](https://sre.google/workbook/error-budget-policy/)
