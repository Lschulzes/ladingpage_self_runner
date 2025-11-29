# TODO: Cost & Performance Levers

## Status

✅ **Completed**

## Overview

Implement cost and performance optimizations including warm runner pools, image pre-pulling, Fargate Spot support, and right-sizing strategies to reduce costs while maintaining performance.

## Why This Matters

**Current State**:

- Cold starts for every runner (slow startup)
- Always using on-demand Fargate (higher cost)
- No image pre-pulling (downloads on every start)
- Fixed resource allocation (may be over-provisioned)

**Problems This Solves**:

- 💰 **High costs**: On-demand Fargate is expensive
- 🐌 **Slow starts**: Cold starts add 30-60 seconds
- 📦 **Image downloads**: Downloading runner image on every start
- 📊 **No optimization**: Can't trade cost vs. performance

**Benefits After Implementation**:

- ✅ **Lower costs**: 50-70% savings with Fargate Spot
- ✅ **Faster starts**: Warm pools eliminate cold starts
- ✅ **Better performance**: Pre-pulled images start instantly
- ✅ **Flexibility**: Choose cost vs. performance per workflow

## What to Implement

### 1. Warm Runner Pool

Maintain a small pool of pre-warmed runners to eliminate cold starts.

**Warm Pool Strategy**:

- **Min capacity**: 1-2 runners always running (idle)
- **Max capacity**: Scale up to 10 during peak
- **Idle timeout**: Stop runners after 10 minutes of inactivity
- **Pre-warming**: Start new runners before pool depleted

**Implementation**:

- **ECS Service**: Set `min: 1` instead of `min: 0`
- **Auto-scaling**: Scale based on queue depth
- **Cost**: ~$30/month for 1 always-on runner (vs. $0 for scale-to-zero)

**Tradeoff**: Higher base cost but faster starts

### 2. Image Pre-Pulling

Pre-pull Docker images to reduce startup time.

**Pre-Pull Strategy**:

- **Base image**: Pre-pull runner base image in warm pool
- **Common images**: Pre-pull frequently used images (node, python, etc.)
- **Layer caching**: Use ECR image caching

**Implementation**:

- **Init container**: Pre-pull images in init container
- **Background job**: Periodic job to pre-pull common images
- **Image registry**: Use ECR for faster pulls (same region)

**Benefits**: 10-30 second reduction in startup time

### 3. Fargate Spot Support

Use Fargate Spot for non-critical workloads to reduce costs.

**Spot Strategy**:

- **Critical workflows**: Use on-demand (main branch, production)
- **Non-critical**: Use Spot (feature branches, PRs)
- **Fallback**: Auto-fallback to on-demand if Spot unavailable

**Cost Savings**: 50-70% vs. on-demand

**Implementation**:

- **Task definition**: Create Spot-capable task definition
- **Launch type**: Use `FARGATE_SPOT` for non-critical
- **Capacity provider**: Configure Spot capacity provider

**Configuration**:

```json
({
  "workflowType": "production",
  "launchType": "FARGATE",
  "capacityProvider": "FARGATE"
},
{
  "workflowType": "pull_request",
  "launchType": "FARGATE_SPOT",
  "capacityProvider": "FARGATE_SPOT"
})
```

### 4. Right-Sizing

Optimize CPU and memory allocation per workflow type.

**Current**: 4 vCPU / 16 GB for all workflows (may be over-provisioned)

**Right-Sizing Strategy**:

- **Small workflows**: 2 vCPU / 8 GB (unit tests, linting)
- **Medium workflows**: 4 vCPU / 16 GB (builds, integration tests)
- **Large workflows**: 8 vCPU / 32 GB (heavy builds, Docker builds)

**Cost Impact**:

- Small: 50% cost reduction
- Medium: Current cost
- Large: 2x cost (but faster, may be net savings)

**Implementation**:

- **Task definitions**: Multiple task definitions per size
- **Workflow detection**: Detect workflow type from webhook
- **Auto-selection**: Choose task definition based on workflow

### 5. Performance vs. Cost Charts

Track and visualize cost/performance tradeoffs.

**Metrics to Track**:

- **Cost per build**: Total cost / number of builds
- **Build time**: Average build duration
- **Startup time**: Time to runner ready
- **Cache hit rate**: Affects build time

**Charts**:

- Cost per build vs. throughput
- Build time vs. cost (on-demand vs. Spot)
- Startup time vs. warm pool size
- Cache hit rate impact on cost

**Dashboard**: Cost optimization dashboard showing:

- Current cost per build
- Potential savings with optimizations
- Performance impact of cost reductions

## Implementation Steps

1. **Implement Warm Pool**

   - Update ECS service: `min: 1`
   - Configure auto-scaling
   - Monitor cost impact

2. **Add Image Pre-Pulling**

   - Update Dockerfile to pre-pull common images
   - Or: Init container for pre-pulling
   - Measure startup time improvement

3. **Add Fargate Spot Support**

   - Create Spot-capable task definition
   - Add workflow type detection
   - Route non-critical to Spot
   - Monitor Spot interruption rate

4. **Implement Right-Sizing**

   - Create multiple task definitions
   - Add workflow size detection
   - Route to appropriate size
   - Track cost savings

5. **Add Cost Metrics**
   - CloudWatch cost metrics
   - Cost per build calculation
   - Performance metrics
   - Cost/performance dashboard

## Success Metrics

- **Cost reduction**: 30-50% overall cost reduction
- **Startup time**: < 10 seconds for warm pool
- **Spot utilization**: > 50% of non-critical workflows
- **Right-sizing accuracy**: > 80% of workflows optimally sized

## Related TODOs

- [Observability & SLOs](./05-observability-and-slos.md) - Cost metrics
- [Queueing & Idempotency](./01-queueing-and-idempotency.md) - Queue depth affects warm pool sizing
