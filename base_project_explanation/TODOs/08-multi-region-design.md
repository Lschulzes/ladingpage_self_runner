# TODO: Multi-Region Design

## Status

✅ **Completed** - Design phase only (no implementation)

## Overview

Design a multi-region architecture for the self-runners infrastructure to provide global availability, disaster recovery, and reduced latency for distributed teams. This is a design document only—implementation will follow after validation.

## Why This Matters

**Current State**:

- Single region deployment (us-east-1)
- No disaster recovery plan
- Higher latency for teams outside US East
- Single point of failure

**Problems This Solves**:

- 🌍 **Global latency**: Reduce latency for teams in different regions
- 🛡️ **Disaster recovery**: Survive regional outages
- 📈 **Scalability**: Distribute load across regions
- 🔄 **High availability**: Continue operating if one region fails

**Benefits After Implementation**:

- ✅ **Lower latency**: Runners closer to developers
- ✅ **Resilience**: Survive regional AWS outages
- ✅ **Scalability**: Handle more load by distributing across regions
- ✅ **Compliance**: Meet data residency requirements (if needed)

## Architecture Design

### 1. Region Selection Strategy

**Primary Regions** (initial):

- **us-east-1** (N. Virginia): Current region, keep as primary
- **eu-west-1** (Ireland): Low latency for European teams
- **ap-southeast-1** (Singapore): Low latency for Asian teams

**Selection Criteria**:

- **Latency**: Proximity to developer teams
- **Cost**: Fargate pricing varies by region
- **Service availability**: All required services available
- **Data residency**: Compliance requirements (if any)

### 2. Region-Sticky Queue Groups

Route webhooks to region-specific queues based on repository or organization.

**Routing Strategy**:

- **Organization-based**: Route by GitHub organization
  - `patient-studio` → us-east-1
  - `europe-team` → eu-west-1
- **Repository-based**: Override per repository
- **Geo-routing**: Route based on webhook source IP (future)

**Queue Architecture**:

```
GitHub Webhook
    ↓
API Gateway (Global)
    ↓
Route by Organization
    ├─→ us-east-1 Queue → us-east-1 Lambda → us-east-1 ECS
    ├─→ eu-west-1 Queue → eu-west-1 Lambda → eu-west-1 ECS
    └─→ ap-southeast-1 Queue → ap-southeast-1 Lambda → ap-southeast-1 ECS
```

**Implementation**:

- **API Gateway**: Route to region-specific Lambda (via EventBridge or direct)
- **EventBridge**: Cross-region event routing
- **Lambda**: Region-specific handlers

### 3. Spillover Plan

Handle capacity overflow by routing to secondary regions.

**Spillover Triggers**:

- **Queue depth**: If primary region queue > 100 messages
- **Concurrency**: If primary region at > 80% capacity
- **Error rate**: If primary region error rate > 5%

**Spillover Logic**:

1. Monitor primary region metrics
2. If spillover triggered: Route new webhooks to secondary region
3. Continue monitoring: Return to primary when capacity available
4. **Sticky routing**: Once routed to secondary, keep workflow in that region

**Spillover Configuration**:

```json
{
  "regions": [
    {
      "name": "us-east-1",
      "priority": 1,
      "spilloverThreshold": {
        "queueDepth": 100,
        "concurrencyPercent": 80,
        "errorRate": 0.05
      }
    },
    {
      "name": "eu-west-1",
      "priority": 2,
      "spilloverThreshold": { ... }
    }
  ]
}
```

### 4. Artifact Cache Replication

Replicate artifact cache across regions for faster access.

**Replication Strategy**:

**Option 1: Active-Active Replication**

- Write to all regions simultaneously
- Read from nearest region
- **Pros**: Fastest reads, no replication lag
- **Cons**: Higher write cost, more storage

**Option 2: Primary-Secondary Replication**

- Write to primary region
- Async replicate to secondary regions
- **Pros**: Lower write cost
- **Cons**: Replication lag, eventual consistency

**Option 3: Regional Caches with Global Index**

- Each region has its own cache
- Global DynamoDB table for cache index
- **Pros**: Simple, no replication needed
- **Cons**: Cache misses in new regions

**Recommended**: Option 3 (Regional Caches) for MVP, Option 1 for production.

**Cache Key Strategy**:

- **Global index**: DynamoDB Global Table for cache metadata
- **Regional storage**: S3 buckets per region
- **Cache key**: Same across regions (content hash)
- **Lookup**: Check global index, download from any region

### 5. Cross-Region Data Synchronization

Synchronize critical data across regions.

**Data to Synchronize**:

- **Workflow mappings**: workflowId → taskArn (for reconciliation)
- **Idempotency keys**: Prevent duplicate processing
- **Cache index**: Artifact cache metadata
- **Configuration**: Concurrency limits, routing rules

**Synchronization Methods**:

**DynamoDB Global Tables**:

- Automatic multi-region replication
- Low latency reads from any region
- Conflict resolution (last-write-wins)
- **Use for**: Workflow mappings, cache index

**EventBridge Cross-Region**:

- Publish events to multiple regions
- Lambda in each region processes events
- **Use for**: Configuration updates, admin actions

**S3 Cross-Region Replication**:

- Replicate artifacts to multiple regions
- **Use for**: Artifact storage (if using active-active)

### 6. Disaster Recovery Plan

Plan for regional outages and failover.

**Failure Scenarios**:

1. **Single region outage**: AWS region becomes unavailable
2. **Partial outage**: Some services unavailable in region
3. **Network partition**: Region isolated from others

**Failover Strategy**:

**Automatic Failover**:

- **Health checks**: Monitor region health (API, ECS, DynamoDB)
- **Route53 health checks**: DNS-based failover
- **Failover time**: < 5 minutes

**Manual Failover**:

- **Admin API**: `/admin/failover/{region}` endpoint
- **Draining**: Gracefully drain region before failover
- **Verification**: Verify failover before completing

**Failover Process**:

1. **Detect failure**: Health check fails
2. **Stop routing**: Stop routing new webhooks to failed region
3. **Drain existing**: Allow existing workflows to complete (or timeout)
4. **Route to backup**: Route new webhooks to backup region
5. **Monitor**: Monitor backup region capacity
6. **Recovery**: When primary recovers, gradually route back

### 7. Cost Considerations

Multi-region deployment increases costs.

**Cost Components**:

- **ECS Fargate**: Same cost per region (usage-based)
- **NAT Gateway**: ~\$32/month per region (always on)
- **Data transfer**: Cross-region data transfer costs
- **DynamoDB**: Global Tables have replication costs
- **S3**: Storage and replication costs

**Cost Optimization**:

- **Regional caches**: Don't replicate everything, cache locally
- **Selective replication**: Only replicate frequently accessed artifacts
- **Lifecycle policies**: Archive old artifacts to Glacier
- **Spot instances**: Use Fargate Spot for non-critical workloads

**Estimated Cost Increase**: 2-3x for 3 regions (mostly NAT Gateway and data transfer)

### 8. Implementation Phases

**Phase 1: Design & Validation** (Current)

- Document architecture
- Validate with team
- Cost analysis
- Risk assessment

**Phase 2: Single Region Enhancement** (Prerequisite)

- Implement queueing and idempotency
- Migrate to DynamoDB
- Add observability
- **Why**: Foundation for multi-region

**Phase 3: Dual Region Pilot**

- Deploy to us-east-1 and eu-west-1
- Organization-based routing
- Regional caches (no replication)
- **Goal**: Validate architecture, measure latency improvement

**Phase 4: Full Multi-Region**

- Add third region (ap-southeast-1)
- Implement spillover
- Add artifact replication
- **Goal**: Production-ready multi-region

## Design Decisions

### Decision 1: Queue Routing vs. Lambda Routing

**Option A**: Route at API Gateway to region-specific queues

- **Pros**: Simple, clear separation
- **Cons**: Requires cross-region API Gateway or EventBridge

**Option B**: Single queue, Lambda routes to regions

- **Pros**: Centralized logic
- **Cons**: Single point of failure, cross-region calls

**Decision**: Option A (Queue Routing) - Better isolation and scalability

### Decision 2: Cache Replication Strategy

**Option A**: Active-active replication (write to all)

- **Pros**: Fastest reads, no lag
- **Cons**: 3x write cost

**Option B**: Regional caches with global index

- **Pros**: Simple, no replication needed
- **Cons**: Cache misses in new regions

**Decision**: Option B for MVP, Option A for production (if cost acceptable)

### Decision 3: Failover Automation

**Option A**: Fully automatic failover

- **Pros**: Fast recovery, no manual intervention
- **Cons**: Risk of false positives, complexity

**Option B**: Manual failover with automation

- **Pros**: Controlled, less risk
- **Cons**: Slower recovery, requires on-call

**Decision**: Option B (Manual with automation) - Safety over speed initially

## Tradeoffs

| Aspect                   | Single Region           | Multi-Region        |
| ------------------------ | ----------------------- | ------------------- |
| **Latency**              | Higher for remote teams | Lower (regional)    |
| **Cost**                 | Lower                   | 2-3x higher         |
| **Complexity**           | Simple                  | Complex             |
| **Resilience**           | Single point of failure | Regional redundancy |
| **Scalability**          | Limited by region       | Distributed load    |
| **Operational Overhead** | Low                     | High (3x regions)   |

## Success Criteria

- **Latency reduction**: p95 latency < 2s for regional teams (vs. 5s+ cross-region)
- **Availability**: 99.9% uptime (survive single region outage)
- **Failover time**: < 5 minutes to failover to backup region
- **Cost increase**: < 3x single region cost

## Risks & Mitigations

**Risk 1**: Increased complexity leads to more failures

- **Mitigation**: Phased rollout, extensive testing, monitoring

**Risk 2**: Cost overruns from replication and data transfer

- **Mitigation**: Start with regional caches, add replication only if needed

**Risk 3**: Data consistency issues across regions

- **Mitigation**: Use DynamoDB Global Tables, eventual consistency acceptable

**Risk 4**: Operational burden of managing 3 regions

- **Mitigation**: Automate as much as possible, use Infrastructure as Code

## Related TODOs

- [Queueing & Idempotency](./01-queueing-and-idempotency.md) - Foundation for multi-region
- [Artifact Store & Cache](./03-artifact-store-and-cache.md) - Cache replication strategy
- [Observability & SLOs](./05-observability-and-slos.md) - Cross-region monitoring

## References

- [AWS Multi-Region Architectures](https://aws.amazon.com/architecture/multi-region/)
- [DynamoDB Global Tables](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html)
- [S3 Cross-Region Replication](https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication.html)
- [EventBridge Multi-Region](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-cross-region.html)
