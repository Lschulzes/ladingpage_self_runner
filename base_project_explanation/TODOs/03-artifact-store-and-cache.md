# TODO: Artifact Store & Remote Build Cache

## Status

✅ **Completed**

## Overview

Implement a content-addressable storage (CAS) system for build artifacts and a remote build cache to dramatically reduce build times by reusing cached dependencies and build outputs.

## Why This Matters

**Current State**:

- No artifact storage (builds must re-download dependencies every time)
- No build cache (every build is a cold build)
- No way to share artifacts between workflows
- No provenance tracking for artifacts

**Problems This Solves**:

- 🐌 **Slow builds**: Every build downloads all dependencies from scratch
- 💰 **Wasted compute**: Rebuilding the same code repeatedly
- 🔒 **No artifact history**: Can't retrieve previous build outputs
- ❓ **No provenance**: Can't verify artifact integrity or source

**Benefits After Implementation**:

- ✅ **Faster builds**: Cache hits can reduce build time by 50-90%
- ✅ **Cost savings**: Fewer compute hours spent on redundant builds
- ✅ **Artifact retention**: Store and retrieve build outputs
- ✅ **Provenance tracking**: Know exactly what code produced each artifact
- ✅ **Better DX**: Developers see faster CI feedback

## What to Implement

### 1. S3 Content-Addressable Storage (CAS)

Store artifacts in S3 using content hashes as keys.

**CAS Design**:

- **Key format**: `artifacts/{contentHash}`
- **Content hash**: SHA-256 of artifact content
- **Metadata**: Store in S3 object metadata or separate DynamoDB entry
- **Lifecycle policies**: Move to Glacier after 90 days, delete after 1 year

**Artifact Types**:

- **Dependencies**: `node_modules`, `vendor/`, `.gradle/cache`
- **Build outputs**: Compiled binaries, Docker images, test results
- **Intermediate artifacts**: Object files, compiled templates

**Storage Structure**:

```
s3://self-runners-artifacts/
  ├── deps/
  │   ├── {hash1}  # node_modules.tar.gz
  │   └── {hash2}  # gradle-cache.tar.gz
  ├── outputs/
  │   ├── {hash3}  # dist.tar.gz
  │   └── {hash4}  # docker-image.tar
  └── metadata/
      └── {hash}.json  # Provenance info
```

### 2. DynamoDB Cache Index

Track cache keys, metadata, and relationships.

**DynamoDB Schema**:

**Table: `self-runners-cache-index`**

```json
{
  "cacheKey": "repo:patient-studio/next-gen-api:lockfile:package-lock.json:node-18",
  "contentHash": "sha256:abc123...",
  "s3Key": "artifacts/abc123...",
  "repository": "patient-studio/next-gen-api",
  "toolchain": "node-18",
  "lockfileHash": "sha256:def456...",
  "createdAt": "2024-01-01T00:00:00Z",
  "lastAccessed": "2024-01-01T00:00:00Z",
  "accessCount": 42,
  "ttl": 1735689600  # 90 days
}
```

**Cache Key Components**:

- Repository
- Lockfile hash (package-lock.json, requirements.txt, etc.)
- Toolchain version (Node.js, Python, Go versions)
- Environment variables (if affecting build)
- Build configuration hash

**Indexes**:

- GSI: `repository-toolchain-index` (query by repo + toolchain)
- GSI: `lockfileHash-index` (find cache by lockfile)

### 3. Cache Key Generation

Generate deterministic cache keys based on inputs that affect the build.

**Cache Key Formula**:

```
cacheKey = hash(
  repository +
  lockfileHash +
  toolchainVersion +
  envVarsHash +
  buildConfigHash
)
```

**Example Cache Keys**:

- **Dependencies**: `deps:patient-studio/next-gen-api:package-lock.json:abc123:node-18`
- **Build output**: `output:patient-studio/next-gen-api:commit:def456:node-18:prod`

**Lockfile Detection**:

- `package-lock.json` (Node.js)
- `yarn.lock` (Yarn)
- `requirements.txt` (Python)
- `go.sum` (Go)
- `Cargo.lock` (Rust)
- `Gemfile.lock` (Ruby)

### 4. Cache Hit/Miss Logic

Implement cache lookup and storage in workflow.

**Cache Lookup Flow**:

1. Generate cache key from repository state
2. Query DynamoDB for cache key
3. If found: Download from S3, extract to workspace
4. If not found: Proceed with normal build
5. After build: Upload artifacts to S3, write to DynamoDB

**Cache Storage Flow**:

1. After successful build: Generate content hash of artifacts
2. Upload to S3 with content hash as key
3. Write cache entry to DynamoDB with cache key → content hash mapping
4. Update access metadata (lastAccessed, accessCount)

### 5. Artifact Provenance

Track what code and environment produced each artifact.

**Provenance Schema**:

```json
{
  "contentHash": "sha256:abc123...",
  "repository": "patient-studio/next-gen-api",
  "commitSha": "def456...",
  "commitMessage": "Fix bug in authentication",
  "branch": "main",
  "workflowRunId": "123456",
  "toolchain": {
    "node": "18.17.0",
    "npm": "9.6.7"
  },
  "buildTime": "2024-01-01T00:00:00Z",
  "buildDuration": 120,
  "dependencies": ["sha256:dep1...", "sha256:dep2..."]
}
```

**Storage**: Store as S3 object metadata or separate DynamoDB table

### 6. Cache Metrics & Observability

Track cache performance and effectiveness.

**Metrics to Emit**:

- **Cache hit rate**: Percentage of builds that hit cache
- **Cache miss rate**: Percentage of builds that miss cache
- **Cache size**: Total storage used in S3
- **Cache age**: Average age of cached artifacts
- **Cache eviction rate**: How often artifacts expire

**Dashboards**:

- Cache hit rate over time (per repository)
- Cache storage growth
- Build time reduction (cache hit vs miss)
- Most frequently accessed artifacts

### 7. Cache Invalidation

Strategies for invalidating stale cache entries.

**Invalidation Triggers**:

- **Lockfile change**: New dependencies added/removed
- **Toolchain change**: Node.js version updated
- **Manual invalidation**: Admin action to clear cache
- **TTL expiration**: Automatic expiration after 90 days

**Invalidation Strategy**:

- **Soft delete**: Mark as invalid in DynamoDB, don't delete S3 immediately
- **Lazy deletion**: Delete S3 objects during lifecycle policy
- **Selective invalidation**: Invalidate by repository, toolchain, or lockfile

## Implementation Steps

1. **Create S3 Bucket**

   - Bucket: `self-runners-artifacts-{stage}`
   - Versioning: Enabled
   - Encryption: SSE-S3 or SSE-KMS
   - Lifecycle: Move to Glacier after 90 days, delete after 1 year

2. **Create DynamoDB Tables**

   - `self-runners-cache-index`: Cache key → content hash mapping
   - `self-runners-artifact-provenance`: Content hash → provenance info
   - Configure TTL for automatic cleanup

3. **Create Cache Library**

   - `src/lib/cache.ts`: Cache lookup and storage functions
   - `src/lib/artifactStore.ts`: S3 upload/download functions
   - `src/lib/provenance.ts`: Provenance generation and storage

4. **Update Runner Image**

   - Add cache CLI tool to Docker image
   - Scripts to generate cache keys
   - Scripts to upload/download artifacts

5. **Add Workflow Actions**

   - GitHub Action: `actions/cache` compatible interface
   - Or custom action: `setup-cache`, `save-cache`

6. **Add Monitoring**

   - CloudWatch metrics: Cache hit/miss, storage size
   - Dashboards: Cache performance over time
   - Alarms: Low cache hit rate, high storage growth

7. **Documentation**
   - How to use cache in workflows
   - Cache key best practices
   - Troubleshooting cache misses

## Success Metrics

- **Cache hit rate**: > 60% for dependency caches
- **Build time reduction**: 50-90% for cache hits
- **Storage efficiency**: < 100GB for typical repository
- **Cache freshness**: Average cache age < 7 days

## Example Workflow Usage

```yaml
name: Build with Cache
on: [push]

jobs:
  build:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v4

      - name: Restore cache
        uses: ./actions/restore-cache
        with:
          key: deps:${{ github.repository }}:${{ hashFiles('package-lock.json') }}:node-18
          paths:
            - node_modules

      - name: Install dependencies
        if: cache-hit != 'true'
        run: npm ci

      - name: Build
        run: npm run build

      - name: Save cache
        if: cache-hit != 'true'
        uses: ./actions/save-cache
        with:
          key: deps:${{ github.repository }}:${{ hashFiles('package-lock.json') }}:node-18
          paths:
            - node_modules
```

## Related TODOs

- [Monorepo Partial Builds](./04-monorepo-partial-builds.md) - Cache keys for monorepo packages
- [Security & Supply Chain](./08-security-and-supply-chain.md) - Provenance feeds into SBOM
- [Observability & SLOs](./05-observability-and-slos.md) - Cache metrics feed into SLOs

## References

- [Content-Addressable Storage](https://en.wikipedia.org/wiki/Content-addressable_storage)
- [GitHub Actions Cache](https://github.com/actions/cache)
- [Bazel Remote Caching](https://docs.bazel.build/versions/main/remote-caching.html)
- [Nix Store](https://nixos.org/manual/nix/stable/package-management/channels.html)
