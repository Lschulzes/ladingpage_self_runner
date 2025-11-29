# TODO: Monorepo Partial Builds

## Status

✅ **Completed**

## Overview

Implement intelligent build scheduling for monorepos that only builds and tests packages that have actually changed, dramatically reducing CI time and costs for large repositories.

## Why This Matters

**Current State**:

- Every workflow runs all tests and builds all packages
- No change detection (builds everything even if only one package changed)
- No dependency graph awareness
- Wasted compute on unchanged packages

**Problems This Solves**:

- 🐌 **Slow CI**: Monorepos with 50+ packages take hours to build
- 💰 **Wasted compute**: Building unchanged packages on every commit
- 🔄 **Redundant work**: Same packages built multiple times
- 📊 **Poor visibility**: Can't see which packages actually changed

**Benefits After Implementation**:

- ✅ **Faster CI**: Only build what changed (often 80-90% faster)
- ✅ **Cost savings**: Fewer compute hours for unchanged packages
- ✅ **Better DX**: Faster feedback on PRs
- ✅ **Scalability**: Can handle monorepos with 100+ packages
- ✅ **Parallel execution**: Build independent packages in parallel

## What to Implement

### 1. Change Detection

Detect which packages/files changed between commits.

**Change Detection Methods**:

- **Git diff**: Compare current commit to base branch
- **File patterns**: Map file paths to packages
- **Package boundaries**: Understand package structure (package.json, Cargo.toml, etc.)

**Supported Monorepo Tools**:

- **Nx**: Native support via Nx Cloud
- **Turborepo**: Native support via Turborepo Remote Cache

**Change Detection Algorithm**:

1. Get changed files: `git diff --name-only base..head`
2. Map files to packages: `src/packages/auth/` → `@repo/auth`
3. Include dependents: If `@repo/auth` changed, also build `@repo/api` (depends on auth)
4. Generate build plan: List of packages to build/test

### 2. Dependency Graph Analysis

Build and analyze the dependency graph to determine what needs rebuilding.

**Dependency Graph Sources**:

- **Package manifests**: `package.json`, `Cargo.toml`, `pom.xml`
- **Lock files**: `package-lock.json`, `Cargo.lock`
- **Build configs**: `tsconfig.json` project references, `nx.json`

**Graph Analysis**:

- **Upstream dependencies**: If `@repo/auth` changed, rebuild `@repo/api` (depends on auth)
- **Downstream dependents**: If `@repo/core` changed, rebuild all packages
- **Transitive dependencies**: Handle multi-level dependencies

**Graph Storage**:

- **DynamoDB table**: `self-runners-dependency-graph`
- **Partition key**: `repository`
- **Attributes**: Package name, dependencies, dependents
- **Update frequency**: On lockfile changes

### 3. Build Plan Generation

Generate an optimized build plan based on changes and dependencies.

**Build Plan Structure**:

```json
{
  "repository": "patient-studio/monorepo",
  "commitSha": "abc123...",
  "baseSha": "def456...",
  "changedPackages": ["@repo/auth", "@repo/utils"],
  "packagesToBuild": [
    {
      "name": "@repo/auth",
      "reason": "changed",
      "dependencies": [],
      "dependents": ["@repo/api", "@repo/web"]
    },
    {
      "name": "@repo/api",
      "reason": "depends on @repo/auth",
      "dependencies": ["@repo/auth"],
      "dependents": []
    }
  ],
  "packagesToSkip": [
    {
      "name": "@repo/other",
      "reason": "no changes, no dependent changes"
    }
  ]
}
```

**Optimization**:

- **Parallel builds**: Build independent packages simultaneously
- **Build order**: Topological sort based on dependencies
- **Cache keys**: Include dependency graph hash in cache key

### 4. Cache Key Strategy

Generate cache keys that include the dependency graph state.

**Cache Key Components**:

- Repository
- Package name
- Lockfile hash (dependencies)
- Dependency graph hash (which packages this depends on)
- Toolchain version
- Build configuration

**Cache Key Formula**:

```
cacheKey = hash(
  repository +
  packageName +
  lockfileHash +
  dependencyGraphHash +
  toolchainVersion
)
```

**Dependency Graph Hash**:

- Hash of all dependencies' content hashes
- If any dependency changes, cache invalidates
- Ensures cache hits only when dependencies unchanged

### 5. Workflow Integration

Integrate change detection into GitHub Actions workflows.

**Workflow Pattern**:

```yaml
name: Monorepo Build
on: [push, pull_request]

jobs:
  detect-changes:
    runs-on: self-hosted
    outputs:
      packages: ${{ steps.changes.outputs.packages }}
    steps:
      - uses: actions/checkout@v4
      - uses: ./actions/detect-changes
        id: changes
        with:
          base: ${{ github.base_ref }}

  build:
    needs: detect-changes
    runs-on: self-hosted
    strategy:
      matrix:
        package: ${{ fromJson(needs.detect-changes.outputs.packages) }}
    steps:
      - uses: actions/checkout@v4
      - name: Build ${{ matrix.package }}
        run: npm run build --workspace=${{ matrix.package }}
```

**Custom Action**: `detect-changes`

- Compares current commit to base
- Maps changed files to packages
- Includes dependents
- Outputs JSON array of packages to build

### 6. Nx/Turborepo Integration

Leverage native monorepo tooling when available.

**Nx Integration**:

- Use `nx affected` command to detect changes
- Use Nx Cloud for remote cache (if configured)
- Fall back to custom detection if Nx not available

**Turborepo Integration**:

- Use `turbo run` with `--filter` for affected packages
- Use Turborepo Remote Cache (if configured)
- Fall back to custom detection if Turborepo not available

**Generic Fallback**:

- File-based change detection
- Package.json dependency analysis
- Manual package boundaries configuration

### 7. Metrics & Observability

Track monorepo build efficiency.

**Metrics**:

- **Packages changed**: Count of packages with changes
- **Packages built**: Count of packages actually built
- **Packages skipped**: Count of packages skipped (cache hit or no changes)
- **Build time reduction**: Time saved vs building everything
- **Cache hit rate**: Per package cache hit rate

**Dashboards**:

- Change detection accuracy
- Build time reduction over time
- Most frequently changed packages
- Dependency graph visualization

## Implementation Steps

1. **Create Change Detection Library**

   - `src/lib/changeDetection.ts`: Git diff analysis
   - `src/lib/packageMapper.ts`: File path → package mapping
   - `src/lib/dependencyGraph.ts`: Dependency graph construction

2. **Create DynamoDB Tables**

   - `self-runners-dependency-graph`: Store package dependency graphs
   - `self-runners-build-plans`: Store generated build plans (for debugging)

3. **Create GitHub Action**

   - `actions/detect-changes/action.yml`: Detect changed packages
   - `actions/detect-changes/index.js`: Implementation
   - Output: JSON array of packages to build

4. **Update Runner Image**

   - Add monorepo tools: Nx CLI, Turborepo CLI (optional)
   - Add change detection scripts

5. **Add Lambda Function** (Optional)

   - Pre-process webhooks to generate build plans
   - Store build plans in DynamoDB
   - Runner can query build plan instead of computing

6. **Add Monitoring**

   - CloudWatch metrics: Packages changed, built, skipped
   - Dashboards: Build efficiency over time

7. **Documentation**
   - How to configure monorepo detection
   - Supported monorepo tools
   - Cache key best practices

## Success Metrics

- **Build time reduction**: 50-90% for typical monorepo changes
- **Packages skipped**: > 70% of packages skipped on average
- **Change detection accuracy**: > 95% (correctly identifies all affected packages)
- **Cache hit rate**: > 60% for unchanged packages

## Example: Nx Monorepo

```yaml
name: Nx Monorepo Build
on: [push, pull_request]

jobs:
  affected:
    runs-on: self-hosted
    outputs:
      projects: ${{ steps.set-matrix.outputs.projects }}
    steps:
      - uses: actions/checkout@v4
      - uses: ./actions/detect-changes
        id: set-matrix
        with:
          tool: nx
          base: ${{ github.base_ref }}

  build:
    needs: affected
    runs-on: self-hosted
    strategy:
      matrix:
        project: ${{ fromJson(needs.affected.outputs.projects) }}
    steps:
      - uses: actions/checkout@v4
      - run: npx nx build ${{ matrix.project }}
```

## Related TODOs

- [Artifact Store & Cache](./03-artifact-store-and-cache.md) - Cache keys include dependency graph
- [Observability & SLOs](./05-observability-and-slos.md) - Build efficiency metrics
- [Queueing & Idempotency](./01-queueing-and-idempotency.md) - Build plans can be cached/idempotent

## References

- [Nx Affected](https://nx.dev/concepts/affected)
- [Turborepo Filtering](https://turbo.build/repo/docs/core-concepts/filtering)
