# TODO: Infrastructure Improvements

This directory contains detailed TODO documents for planned infrastructure improvements. Each document describes what to implement, why it's beneficial, and how to approach it at a high level.

## Overview

These TODOs are based on feedback to make the self-runners infrastructure "large-scale grade" and production-ready. They address scalability, reliability, observability, security, and cost optimization.

## TODO List

### Core Infrastructure

1. **[Queueing & Idempotency](./01-queueing-and-idempotency.md)**

   - SQS FIFO queue for webhook processing
   - Idempotency keys to prevent duplicate runners
   - Dead Letter Queue (DLQ) for failed messages
   - **Priority**: High - Foundation for scalability

2. **[Concurrency & Back-Pressure](./02-concurrency-and-backpressure.md)**

   - Per-repository concurrency limits
   - GitHub API rate limiting
   - Back-pressure mechanisms
   - Draining mode for maintenance
   - **Priority**: High - Prevents resource exhaustion

3. **[Reliability Controls](./06-reliability-controls.md)**
   - Reconciliation job for orphaned runners
   - Exactly-once cleanup semantics
   - Automatic orphan detection and cleanup
   - **Priority**: High - Prevents cost leaks and ensures reliability

### Performance & Efficiency

4. **[Artifact Store & Remote Build Cache](./03-artifact-store-and-cache.md)**

   - S3 Content-Addressable Storage (CAS)
   - DynamoDB cache index
   - Cache hit/miss metrics
   - **Priority**: High - Dramatically reduces build times

5. **[Monorepo Partial Builds](./04-monorepo-partial-builds.md)**

   - Change detection for monorepos
   - Dependency graph analysis
   - Build only what changed
   - **Priority**: Medium - Significant time savings for monorepos

6. **[Cost & Performance Levers](./09-cost-performance-levers.md)**
   - Warm runner pools
   - Fargate Spot support
   - Right-sizing strategies
   - Image pre-pulling
   - **Priority**: Medium - Cost optimization

### Observability & Operations

7. **[Observability & SLOs](./05-observability-and-slos.md)**
   - Correlation IDs for request tracing
   - Service Level Objectives (SLOs)
   - Error budgets
   - Advanced dashboards
   - **Priority**: High - Essential for production operations

### Security & Compliance

8. **[Security & Supply Chain](./07-security-and-supply-chain.md)**
   - GitHub App authentication (replace PATs)
   - Artifact provenance tracking
   - Software Bill of Materials (SBOM)
   - Vulnerability scanning
   - **Priority**: High - Security and compliance requirements

### Scale & Architecture

9. **[Multi-Region Design](./08-multi-region-design.md)**

   - Multi-region architecture design
   - Region-sticky queue groups
   - Spillover plan
   - Artifact cache replication
   - **Priority**: Low - Design phase only, no implementation

10. **[Terraform Parity](./10-terraform-parity.md)**
    - Terraform module for core infrastructure
    - API Gateway, SQS, Lambda in Terraform
    - Coexistence with SST/Pulumi

### Distribution & Reusability

11. **[Reusable GitHub Action](./11-github-action-reusable.md)**
    - Package infrastructure as standalone GitHub Action
    - One-step deployment with configurable inputs
    - Support for multiple environments
    - Version management and documentation
    - **Priority**: Medium - Enables easy adoption and reuse

## Implementation Priority

### Phase 1: Foundation (Weeks 1-2)

These are prerequisites for other improvements:

- ✅ Queueing & Idempotency
- ✅ Reliability Controls
- ✅ Observability & SLOs

### Phase 2: Performance (Weeks 3-4)

These provide immediate value:

- ✅ Artifact Store & Cache
- ✅ Concurrency & Back-Pressure

### Phase 3: Advanced Features (Weeks 5-6)

These add polish and optimization:

- ✅ Monorepo Partial Builds
- ✅ Security & Supply Chain
- ✅ Cost & Performance Levers

### Phase 4: Scale (Future)

These are for future scaling needs:

- ⏳ Multi-Region Design
- ⏳ Terraform Parity
- ⏳ Reusable GitHub Action

## Status Legend

- 🟡 **Planned**: Documented, not yet implemented
- 🟢 **In Progress**: Currently being implemented
- ✅ **Completed**: Implemented and documented
- 🔴 **Blocked**: Blocked by dependencies

## How to Use These TODOs

1. **Read the TODO**: Understand what needs to be built and why
2. **Check Dependencies**: Review "Related TODOs" section
3. **Plan Implementation**: Break down into smaller tasks
4. **Implement**: Follow the implementation steps
5. **Update Status**: Mark as completed and move to documentation

## Contributing

When implementing a TODO:

1. **Update Status**: Change status from 🟡 to 🟢 when starting
2. **Follow Steps**: Use the implementation steps as a guide
3. **Add Details**: Add technical details as you learn
4. **Document**: Move completed sections to main documentation
5. **Mark Complete**: Change status to ✅ when done

## Notes

- These TODOs are **descriptive, not prescriptive** - adjust as needed
- Implementation details will be added as work progresses
- Some TODOs may be combined or split based on implementation
- Priority and phases may change based on business needs
