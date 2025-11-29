# TODO: Security & Supply Chain

## Status

✅ **Completed**

## Overview

Enhance security by migrating from Personal Access Tokens (PATs) to GitHub App credentials, implement artifact provenance tracking, and add Software Bill of Materials (SBOM) generation for supply chain security.

## Why This Matters

**Current State**:

- Uses GitHub Personal Access Tokens (long-lived, broad permissions)
- No artifact provenance tracking
- No SBOM generation
- No supply chain security validation

**Problems This Solves**:

- 🔒 **Security risk**: PATs are long-lived and have broad permissions
- 📦 **No traceability**: Can't verify what code produced which artifacts
- 🛡️ **Supply chain risk**: No visibility into dependencies and vulnerabilities
- ✅ **Compliance**: Missing SLSA-like attestations for artifacts

**Benefits After Implementation**:

- ✅ **Better security**: Short-lived, scoped GitHub App tokens
- ✅ **Provenance tracking**: Know exactly what produced each artifact
- ✅ **SBOM compliance**: Meet security and compliance requirements
- ✅ **Supply chain visibility**: Track dependencies and vulnerabilities
- ✅ **Attestation**: SLSA-like provenance for artifacts

## What to Implement

### 1. GitHub App Authentication

Migrate from Personal Access Tokens to GitHub App credentials.

**Why GitHub Apps?**:

- **Short-lived tokens**: Tokens expire after 1 hour
- **Scoped permissions**: Only request needed permissions
- **Per-installation**: Tokens scoped to specific installations
- **Better security**: No long-lived credentials

**GitHub App Setup**:

1. **Create GitHub App**: In GitHub organization settings
2. **Permissions**:
   - `actions:read` (read workflow runs)
   - `actions:write` (manage runners, registration tokens)
3. **Install App**: Install on organization or repositories
4. **Store Credentials**: Private key in AWS Secrets Manager

**Token Generation Flow**:

1. **Get Installation ID**: From GitHub App installation
2. **Generate JWT**: Sign JWT with private key (expires in 10 minutes)
3. **Exchange for Token**: Use JWT to get installation access token (expires in 1 hour)
4. **Cache Token**: Cache in DynamoDB (TTL: 50 minutes)
5. **Use Token**: Use for GitHub API calls

**Implementation**:

- **Library**: `@octokit/auth-app` for JWT generation
- **Storage**: Private key in Secrets Manager
- **Cache**: Installation tokens in DynamoDB

### 2. Artifact Provenance

Track detailed provenance for all build artifacts.

**Provenance Schema** (SLSA-inspired):

```json
{
  "version": "1.0",
  "buildType": "github-actions",
  "builder": {
    "id": "self-runners-infra",
    "version": "1.0.0"
  },
  "buildConfig": {
    "repository": "patient-studio/next-gen-api",
    "workflow": "build.yml",
    "workflowRunId": "123456",
    "workflowRunAttempt": 1
  },
  "source": {
    "uri": "git+https://github.com/patient-studio/next-gen-api",
    "digest": {
      "sha1": "abc123...",
      "sha256": "def456..."
    },
    "ref": "refs/heads/main",
    "commit": {
      "sha": "abc123...",
      "message": "Fix bug",
      "author": "user@example.com",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  },
  "materials": [
    {
      "uri": "git+https://github.com/patient-studio/next-gen-api",
      "digest": { "sha1": "abc123..." }
    },
    {
      "uri": "pkg:npm/lodash@4.17.21",
      "digest": { "sha512": "..." }
    }
  ],
  "invocation": {
    "configSource": {
      "uri": "git+https://github.com/patient-studio/next-gen-api",
      "digest": { "sha1": "..." },
      "entryPoint": ".github/workflows/build.yml"
    },
    "parameters": {
      "environment": "production",
      "node_version": "18"
    },
    "environment": {
      "runner": "self-hosted",
      "os": "linux",
      "arch": "arm64"
    }
  },
  "results": [
    {
      "uri": "s3://self-runners-artifacts/abc123...",
      "digest": {
        "sha256": "abc123..."
      },
      "mimeType": "application/tar+gzip"
    }
  ],
  "metadata": {
    "buildStartedOn": "2024-01-01T00:00:00Z",
    "buildFinishedOn": "2024-01-01T00:05:00Z",
    "completeness": {
      "parameters": true,
      "environment": true,
      "materials": true
    },
    "reproducible": false
  }
}
```

**Provenance Storage**:

- **S3**: Store as JSON alongside artifacts
- **DynamoDB**: Index by content hash for lookup
- **Signature**: Optional: Sign provenance with private key

### 3. Software Bill of Materials (SBOM)

Generate SBOM for all build artifacts.

**SBOM Format**: SPDX 2.3 or CycloneDX

**SBOM Content**:

- **Packages**: All dependencies (direct and transitive)
- **Files**: All files in artifact
- **Licenses**: License information for each package
- **Vulnerabilities**: Known vulnerabilities (from vulnerability DB)

**SBOM Generation**:

- **Tools**:
  - `syft` (Anchore) for container images
  - `npm audit` for Node.js
  - `safety` for Python
  - `snyk` for multiple languages
- **Timing**: Generate during build, store with artifact

**SBOM Storage**:

- **S3**: Store alongside artifacts
- **DynamoDB**: Index by artifact hash
- **Format**: JSON (SPDX or CycloneDX)

### 4. Provenance Attestation

Sign provenance documents for tamper-proof verification.

**Attestation Format**: In-toto attestation (SLSA)

**Attestation Structure**:

```json
{
  "payloadType": "application/vnd.in-toto+json",
  "payload": "<base64-encoded-provenance>",
  "signatures": [
    {
      "keyid": "key-id",
      "sig": "<signature>"
    }
  ]
}
```

**Signing**:

- **Key**: AWS KMS or Secrets Manager (private key)
- **Algorithm**: RS256 or ES256
- **Verification**: Public key available for verification

**Storage**: Store attestations alongside artifacts in S3

### 5. Dependency Tracking

Track all dependencies used in builds.

**Dependency Sources**:

- **Lock files**: `package-lock.json`, `yarn.lock`, `Cargo.lock`
- **Manifest files**: `package.json`, `requirements.txt`, `go.mod`
- **Container images**: Base image dependencies

**Dependency Database**:

- **DynamoDB table**: `self-runners-dependencies`
- **Schema**:
  ```json
  {
    "artifactHash": "sha256:abc123...",
    "dependencies": [
      {
        "name": "lodash",
        "version": "4.17.21",
        "type": "npm",
        "license": "MIT",
        "vulnerabilities": []
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z"
  }
  ```

### 6. Vulnerability Scanning

Scan dependencies for known vulnerabilities.

**Vulnerability Sources**:

- **GitHub Advisory Database**: Free, comprehensive
- **Snyk**: Commercial, detailed
- **OSV**: Open Source Vulnerabilities

**Scanning Process**:

1. **Extract dependencies**: From SBOM or lock files
2. **Query vulnerability DB**: Check each dependency
3. **Store results**: In DynamoDB with artifact hash
4. **Alert**: If critical vulnerabilities found

**Vulnerability Storage**:

- **DynamoDB**: Store with dependencies
- **Severity levels**: Critical, High, Medium, Low
- **CVE IDs**: Link to CVE database

### 7. Access Control

Implement fine-grained access control for artifacts and provenance.

**Access Control Model**:

- **Repository-based**: Artifacts accessible to repository members
- **Organization-based**: Organization members can access org artifacts
- **Public artifacts**: Some artifacts can be public (if repository is public)

**Implementation**:

- **IAM policies**: S3 bucket policies
- **Presigned URLs**: Time-limited access to artifacts
- **API Gateway**: Authorize requests before S3 access

## Implementation Steps

1. **Create GitHub App**

   - Register app in GitHub organization
   - Configure permissions
   - Install on repositories
   - Store private key in Secrets Manager

2. **Migrate Token Generation**

   - Update `getRunnerToken` to use GitHub App
   - Implement JWT generation
   - Implement token caching
   - Remove PAT usage

3. **Implement Provenance Generation**

   - Create provenance schema
   - Generate provenance during build
   - Store in S3 and DynamoDB

4. **Add SBOM Generation**

   - Integrate SBOM tools into runner image
   - Generate SBOM during build
   - Store alongside artifacts

5. **Implement Attestation**

   - Generate attestations
   - Sign with KMS or private key
   - Store with artifacts

6. **Add Dependency Tracking**

   - Extract dependencies from builds
   - Store in DynamoDB
   - Link to artifacts

7. **Add Vulnerability Scanning**

   - Integrate vulnerability scanners
   - Scan dependencies
   - Store results and alert

8. **Update Documentation**
   - Document GitHub App setup
   - Explain provenance format
   - Document SBOM usage

## Success Metrics

- **GitHub App migration**: 100% of tokens from GitHub App (0% PAT usage)
- **Provenance coverage**: 100% of artifacts have provenance
- **SBOM coverage**: 100% of artifacts have SBOM
- **Vulnerability detection**: < 24 hours to detect new vulnerabilities
- **Attestation coverage**: 100% of artifacts have signed attestations

## Example Provenance Lookup

```bash
# Get provenance for artifact
aws s3 cp s3://self-runners-artifacts/provenance/abc123.json - | jq

# Verify attestation
cosign verify-attestation \
  --key public-key.pem \
  s3://self-runners-artifacts/attestations/abc123.json

# Get SBOM
aws s3 cp s3://self-runners-artifacts/sbom/abc123.spdx.json - | jq
```

## Related TODOs

- [Artifact Store & Cache](./03-artifact-store-and-cache.md) - Provenance stored with artifacts
- [Reliability Controls](./06-reliability-controls.md) - Provenance helps verify artifact integrity
- [Observability & SLOs](./05-observability-and-slos.md) - Security metrics

## References

- [GitHub Apps](https://docs.github.com/en/apps)
- [SLSA Framework](https://slsa.dev/)
- [SPDX Specification](https://spdx.dev/)
- [CycloneDX](https://cyclonedx.org/)
- [In-toto Attestation](https://github.com/in-toto/attestation)
- [OSV Database](https://osv.dev/)
