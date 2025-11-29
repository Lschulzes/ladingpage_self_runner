# TODO: Concurrency Windows & Back-Pressure

## Status

✅ **Completed**

## Overview

Implement intelligent concurrency controls and back-pressure mechanisms to prevent resource exhaustion, respect GitHub API rate limits, and provide graceful degradation during high load.

## Why This Matters

**Current State**:

- Hard limit of 6 concurrent runners (no per-repo limits)
- No rate limiting for GitHub API calls
- No graceful degradation during overload
- No way to safely drain/stop accepting new work

**Problems This Solves**:

- 🚫 **Resource exhaustion**: Single repo could consume all 6 runners
- 🚫 **GitHub API throttling**: Uncontrolled token generation hits rate limits
- 🚫 **No prioritization**: All workflows treated equally
- 🚫 **No graceful shutdown**: Can't safely stop accepting new work

**Benefits After Implementation**:

- ✅ **Fair resource allocation**: Per-repo limits ensure no single repo dominates
- ✅ **Rate limit protection**: Controlled GitHub API usage prevents throttling
- ✅ **Graceful degradation**: System can slow down or reject work when overloaded
- ✅ **Draining mode**: Safely stop accepting new work for maintenance
- ✅ **Better observability**: Concurrency metrics per repo/organization

## What to Implement

### 1. Per-Repository Concurrency Limits

Enforce maximum concurrent runners per repository.

**Configuration**:

- **Default limit**: 2 runners per repository
- **Configurable per repo**: Allow override via configuration
- **Organization-level limits**: Aggregate limit across all repos in org

**Implementation**:

- Track running tasks per repository in DynamoDB
- Before launching runner: Check current count vs limit
- If at limit: Queue message or reject (based on back-pressure strategy)

**DynamoDB Schema**:

```json
{
  "repository": "patient-studio/next-gen-api",
  "runningCount": 2,
  "lastUpdated": "2024-01-01T00:00:00Z"
}
```

### 2. GitHub API Rate Limiting

Control token generation to respect GitHub API rate limits.

**Current Issue**: Each webhook triggers a token generation API call, which can hit rate limits.

**Solution**:

- **Token cache**: Cache runner registration tokens (valid for 1 hour)
- **Rate limiter**: Use token bucket algorithm to limit API calls
- **Per-org limits**: Track API calls per organization
- **Backoff on 429**: Automatically back off when rate limited

**Token Cache Strategy**:

- Cache key: `{organization}#{repository}`
- TTL: 50 minutes (tokens valid for 1 hour)
- Refresh: Proactively refresh at 45 minutes

### 3. Back-Pressure Mechanism

Implement back-pressure to slow down or reject work when system is overloaded.

**Triggers for Back-Pressure**:

- **Queue depth**: If queue > 100 messages, slow down processing
- **Concurrency**: If total runners > 80% of max, reject new work
- **API rate limits**: If GitHub API throttling, pause token generation
- **Error rate**: If error rate > 5%, slow down processing

**Back-Pressure Actions**:

1. **Slow down**: Increase visibility timeout, reduce processing rate
2. **Reject**: Return 503 to API Gateway, message goes to DLQ
3. **Queue**: Hold messages in queue until capacity available

**HTTP Response Codes**:

- `200`: Accepted, processing
- `429`: Rate limited, retry after X seconds
- `503`: Overloaded, retry later

### 4. Draining Mode

Allow system to gracefully stop accepting new work for maintenance or scaling events.

**Draining Mode States**:

- **Normal**: Accept all work
- **Draining**: Stop accepting new work, finish existing work
- **Maintenance**: Reject all work, emergency stop

**Implementation**:

- **Feature flag**: DynamoDB table or Parameter Store
- **API endpoint**: `/admin/draining` to toggle mode
- **Lambda check**: Before processing, check draining mode
- **Graceful shutdown**: Wait for running tasks to complete

**Draining Mode Behavior**:

- New webhooks: Return 503 "System draining"
- Queued messages: Process existing queue, don't accept new
- Running tasks: Allow to complete
- Metrics: Track time to drain (all tasks complete)

### 5. Priority Queue (Future Enhancement)

Support priority levels for workflows (e.g., production > staging > development).

**Priority Levels**:

- **Critical**: Production deployments, security patches
- **High**: Main branch builds, releases
- **Normal**: Feature branches, PRs
- **Low**: Experimental, personal branches

**Implementation**:

- Add `priority` field to webhook payload (or derive from branch)
- Use SQS message attributes for priority
- Process high-priority messages first
- Lower-priority messages wait when at capacity

## Implementation Steps

1. **Create Concurrency Tracking Table**

   - DynamoDB table: `self-runners-concurrency`
   - Partition key: `repository` (string)
   - Attributes: `runningCount`, `lastUpdated`
   - Atomic increments/decrements for accuracy

2. **Implement Token Cache**

   - DynamoDB table: `self-runners-tokens`
   - Partition key: `cacheKey` (org#repo)
   - TTL: `expiresAt`
   - Refresh logic in Lambda

3. **Add Rate Limiter**

   - Token bucket algorithm
   - Track in DynamoDB or in-memory (Lambda)
   - Configurable rate per organization

4. **Update Lambda Handler**

   - Check concurrency limits before launch
   - Check draining mode
   - Implement back-pressure logic
   - Return appropriate HTTP status codes

5. **Add Admin Endpoint**

   - `/admin/draining` - Toggle draining mode
   - `/admin/limits` - View/update concurrency limits
   - Protected by API key or IAM

6. **Add Monitoring**
   - CloudWatch metrics: Concurrency per repo, queue depth, rejection rate
   - Alarms: High queue depth, high rejection rate, draining mode active

## Success Metrics

- **Per-repo fairness**: No single repo uses > 50% of capacity
- **API rate limit hits**: < 1 per day
- **Rejection rate**: < 1% of requests (when not draining)
- **Drain time**: < 30 minutes for graceful shutdown
- **Queue processing**: p95 latency < 10 seconds

## Configuration Examples

### Per-Repository Limits

```json
{
  "patient-studio/next-gen-api": 3,
  "patient-studio/frontend": 2,
  "default": 1
}
```

### Rate Limits

```json
{
  "githubApiCallsPerMinute": 10,
  "tokensPerRepositoryPerHour": 5
}
```

### Back-Pressure Thresholds

```json
{
  "maxQueueDepth": 100,
  "maxConcurrencyPercent": 80,
  "maxErrorRate": 0.05
}
```

## Related TODOs

- [Queueing & Idempotency](./01-queueing-and-idempotency.md) - Queue depth feeds into back-pressure
- [Observability & SLOs](./05-observability-and-slos.md) - Concurrency metrics feed into SLOs
- [Reliability Controls](./07-reliability-controls.md) - Draining mode used during maintenance

## References

- [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket)
- [GitHub API Rate Limiting](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting)
- [Back-Pressure Patterns](https://aws.amazon.com/builders-library/implementing-backpressure/)
