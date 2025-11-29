import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  GitBranch,
  Code,
  Users,
  Building2,
  Lock,
  MessageSquare,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export function LandingPage() {
  return (
    <div className='min-h-screen bg-background'>
      {/* Navigation */}
      <nav className='border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50'>
        <div className='container mx-auto px-4'>
          <div className='flex h-16 items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Code className='h-6 w-6 text-primary' />
              <span className='font-bold text-lg'>Self-Runners</span>
            </div>
            <div className='flex items-center gap-2'>
              <Button variant='ghost' size='sm'>
                Docs
              </Button>
              <Button variant='ghost' size='sm'>
                GitHub
              </Button>
              <ThemeToggle />
              <Button size='sm'>Get Started</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className='relative overflow-hidden border-b'>
        <div className='container mx-auto px-4 py-24 md:py-32'>
          <div className='mx-auto max-w-6xl'>
            <div className='grid md:grid-cols-2 gap-12 items-center'>
              {/* Left: Text Content */}
              <div className='space-y-6'>
                <h1 className='text-5xl md:text-6xl font-bold tracking-tight'>
                  Ephemeral GitHub Actions runners,
                  <br />
                  <span className='text-primary'>production-ready</span>.
                </h1>
                <p className='text-xl md:text-2xl text-muted-foreground'>
                  Launch self-hosted runners on AWS only when you need
                  them—secure, observable, and cost-efficient.
                </p>
                <div className='flex flex-col sm:flex-row gap-4 pt-4'>
                  <Button size='lg' className='text-lg px-8'>
                    Get Started
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </Button>
                  <Button size='lg' variant='outline' className='text-lg px-8'>
                    View on GitHub
                  </Button>
                </div>
                <div className='flex items-center gap-2 text-sm text-muted-foreground pt-2'>
                  <span className='inline-flex items-center gap-1'>
                    <span className='h-2 w-2 rounded-full bg-green-500'></span>
                    Production-ready
                  </span>
                  <span>·</span>
                  <span>Open Source · MIT License</span>
                </div>
              </div>

              {/* Right: Terminal Log */}
              <div className='hidden md:block'>
                <div className='bg-card border-2 rounded-lg overflow-hidden shadow-lg'>
                  <div className='bg-muted px-4 py-2 flex items-center gap-2 border-b'>
                    <div className='h-2.5 w-2.5 rounded-full bg-red-500'></div>
                    <div className='h-2.5 w-2.5 rounded-full bg-yellow-500'></div>
                    <div className='h-2.5 w-2.5 rounded-full bg-green-500'></div>
                    <span className='ml-2 text-xs text-muted-foreground font-mono'>
                      runner-orchestrator
                    </span>
                  </div>
                  <div className='p-6 font-mono text-sm space-y-2 bg-[#0d1117] text-[#c9d1d9]'>
                    <div className='flex items-center gap-2'>
                      <span className='text-primary'>&gt;</span>
                      <span className='text-[#79c0ff]'>github:</span>
                      <span>received workflow_run.queued</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-primary'>&gt;</span>
                      <span className='text-[#79c0ff]'>scheduler:</span>
                      <span>starting runner for monorepo-ci</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-primary'>&gt;</span>
                      <span className='text-[#79c0ff]'>ecs:</span>
                      <span>runTask arn:aws:ecs:...</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-primary'>&gt;</span>
                      <span className='text-[#79c0ff]'>runner:</span>
                      <span>registered as self-hosted #47</span>
                    </div>
                    <div className='flex items-center gap-2 pt-2 border-t border-[#30363d]'>
                      <span className='text-green-500'>✓</span>
                      <span>workflow completed in 7m 13s – cleanup OK</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why This Exists Section */}
      <section className='py-24 border-b'>
        <div className='container mx-auto px-4'>
          <div className='mx-auto max-w-6xl'>
            <h2 className='text-3xl md:text-4xl font-bold text-center mb-12'>
              Why this exists
            </h2>
            <div className='grid md:grid-cols-3 gap-6'>
              <Card className='border-2 hover:border-primary/50 transition-colors'>
                <CardHeader>
                  <div className='flex items-center gap-3 mb-2'>
                    <Zap className='h-6 w-6 text-primary' />
                    <CardTitle className='text-xl'>
                      Stop babysitting runners
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className='text-muted-foreground'>
                    No more long-lived EC2 boxes you have to patch, reboot, and
                    clean up.
                  </p>
                </CardContent>
              </Card>
              <Card className='border-2 hover:border-primary/50 transition-colors'>
                <CardHeader>
                  <div className='flex items-center gap-3 mb-2'>
                    <Shield className='h-6 w-6 text-primary' />
                    <CardTitle className='text-xl'>
                      Control cost & concurrency
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className='text-muted-foreground'>
                    Fargate + smart concurrency limits so a single repo can't
                    melt your CI budget.
                  </p>
                </CardContent>
              </Card>
              <Card className='border-2 hover:border-primary/50 transition-colors'>
                <CardHeader>
                  <div className='flex items-center gap-3 mb-2'>
                    <CheckCircle2 className='h-6 w-6 text-primary' />
                    <CardTitle className='text-xl'>
                      Production-grade reliability
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className='text-muted-foreground'>
                    Queues, idempotency, DLQs, reconciliation jobs, and
                    observability baked in.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className='py-24 border-b bg-muted/30'>
        <div className='container mx-auto px-4'>
          <div className='mx-auto max-w-6xl'>
            <h2 className='text-3xl md:text-4xl font-bold text-center mb-12'>
              How it works
            </h2>
            <div className='grid md:grid-cols-2 gap-12 items-center'>
              {/* Architecture Diagram */}
              <div className='space-y-4'>
                <div className='bg-card border-2 rounded-lg p-8'>
                  <div className='flex flex-col items-center space-y-6'>
                    <div className='flex items-center space-x-3 w-full justify-center'>
                      <div className='bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-lg font-mono text-sm font-semibold shadow-sm'>
                        GitHub
                      </div>
                      <ArrowRight className='h-5 w-5 text-muted-foreground' />
                      <div className='bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-lg font-mono text-sm font-semibold shadow-sm'>
                        API Gateway
                      </div>
                    </div>
                    <ArrowRight className='h-5 w-5 text-muted-foreground rotate-90' />
                    <div className='flex items-center space-x-3 w-full justify-center'>
                      <div className='bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-lg font-mono text-sm font-semibold shadow-sm'>
                        Lambda
                      </div>
                      <ArrowRight className='h-5 w-5 text-muted-foreground' />
                      <div className='bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-lg font-mono text-sm font-semibold shadow-sm'>
                        ECS Fargate
                      </div>
                    </div>
                    <ArrowRight className='h-5 w-5 text-muted-foreground rotate-90' />
                    <div className='bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-lg font-mono text-sm font-semibold shadow-sm'>
                      GitHub
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className='space-y-6'>
                <div className='flex gap-4'>
                  <div className='flex-shrink-0'>
                    <div className='h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center'>
                      <GitBranch className='h-5 w-5 text-primary' />
                    </div>
                  </div>
                  <div>
                    <h3 className='font-semibold text-lg mb-2'>
                      Webhook layer
                    </h3>
                    <p className='text-muted-foreground'>
                      Validates events, applies org/repo policies, pushes to
                      queue.
                    </p>
                  </div>
                </div>
                <div className='flex gap-4'>
                  <div className='flex-shrink-0'>
                    <div className='h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center'>
                      <Code className='h-5 w-5 text-primary' />
                    </div>
                  </div>
                  <div>
                    <h3 className='font-semibold text-lg mb-2'>Orchestrator</h3>
                    <p className='text-muted-foreground'>
                      Manages concurrency, rate limits, idempotency & cleanup.
                    </p>
                  </div>
                </div>
                <div className='flex gap-4'>
                  <div className='flex-shrink-0'>
                    <div className='h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center'>
                      <Zap className='h-5 w-5 text-primary' />
                    </div>
                  </div>
                  <div>
                    <h3 className='font-semibold text-lg mb-2'>Runner tasks</h3>
                    <p className='text-muted-foreground'>
                      Ephemeral Fargate tasks with custom runner image + cache.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Before vs After Section */}
      <section className='py-24 border-b bg-muted/30'>
        <div className='container mx-auto px-4'>
          <div className='mx-auto max-w-6xl'>
            <h2 className='text-3xl md:text-4xl font-bold text-center mb-12'>
              What it changes in practice
            </h2>
            <div className='grid md:grid-cols-2 gap-8'>
              <Card className='border-2 border-red-200 dark:border-red-900/30'>
                <CardHeader>
                  <CardTitle className='text-xl text-red-600 dark:text-red-400'>
                    Before
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <p className='text-sm text-muted-foreground'>
                    Long-lived EC2 runner
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    Manual patching / rebooting
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    Surprise bills when someone forgets to shut it down
                  </p>
                </CardContent>
              </Card>
              <Card className='border-2 border-primary/30'>
                <CardHeader>
                  <CardTitle className='text-xl text-primary'>After</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <p className='text-sm text-muted-foreground'>
                    Fargate runner spins up per workflow
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    Idempotent orchestration (no duplicate runners)
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    Auto-cleanup, dashboards, and Slack alerts
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-24 border-b'>
        <div className='container mx-auto px-4'>
          <div className='mx-auto max-w-6xl'>
            <h2 className='text-3xl md:text-4xl font-bold text-center mb-12'>
              Features
            </h2>
            <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>
                    Ephemeral runners by design
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground'>
                    Auto-register on start, auto-deregister on exit, no orphaned
                    runners.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>
                    Queueing & idempotency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground'>
                    Avoid duplicate runners, apply back-pressure, and handle
                    bursty traffic safely.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>
                    Concurrency windows & rate limits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground'>
                    Per-repo limits, GitHub API protection, draining mode for
                    maintenance.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Build acceleration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground'>
                    Remote artifact store, build cache, and monorepo partial
                    builds for large repos.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>
                    Reliability & observability
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground'>
                    SLO-oriented alerts, correlation IDs, dashboards,
                    reconciliation jobs.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>
                    Security & supply chain
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground'>
                    GitHub Apps (not PATs), encrypted secrets, SBOM/provenance
                    for artifacts.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Who Is This For Section */}
      <section className='py-16 border-b'>
        <div className='container mx-auto px-4'>
          <div className='mx-auto max-w-4xl'>
            <h2 className='text-2xl md:text-3xl font-bold text-center mb-8'>
              Who it's for
            </h2>
            <div className='space-y-3 text-center'>
              <p className='text-muted-foreground'>
                Platform / DevOps engineers managing GitHub Actions at scale
              </p>
              <p className='text-muted-foreground'>
                Teams with monorepos or heavy test suites
              </p>
              <p className='text-muted-foreground'>
                Orgs needing stricter security / compliance for CI workloads
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quickstart Section */}
      <section className='py-24 border-b'>
        <div className='container mx-auto px-4'>
          <div className='mx-auto max-w-4xl'>
            <h2 className='text-3xl md:text-4xl font-bold text-center mb-12'>
              Quickstart
            </h2>
            <div className='space-y-8'>
              <div className='space-y-4'>
                <h3 className='text-xl font-semibold'>1. Install</h3>
                <div className='bg-card border rounded-lg p-4'>
                  <code className='text-sm font-mono'>
                    npm install
                    <br />
                    # or
                    <br />
                    git clone &lt;repo&gt; && pnpm install
                  </code>
                </div>
              </div>

              <div className='space-y-4'>
                <h3 className='text-xl font-semibold'>2. Deploy</h3>
                <div className='bg-card border rounded-lg p-4'>
                  <code className='text-sm font-mono'>
                    pulumi up
                    <br />
                    # or
                    <br />
                    sst deploy
                  </code>
                </div>
              </div>

              <div className='space-y-4'>
                <h3 className='text-xl font-semibold'>3. Wire into GitHub</h3>
                <div className='bg-card border rounded-lg p-4'>
                  <code className='text-sm font-mono whitespace-pre'>
                    {`name: Test Runner
on: [push, pull_request]

jobs:
  test:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v4
      - name: Test
        run: echo "Hello from ephemeral runner!"`}
                  </code>
                </div>
              </div>

              <div className='pt-4 text-center'>
                <Button variant='link' className='text-primary'>
                  View full docs
                  <ArrowRight className='ml-2 h-4 w-4' />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For / FAQ Section */}
      <section className='py-24'>
        <div className='container mx-auto px-4'>
          <div className='mx-auto max-w-4xl'>
            <h2 className='text-3xl md:text-4xl font-bold text-center mb-12'>
              Who it's for
            </h2>
            <div className='grid md:grid-cols-3 gap-6 mb-16'>
              <Card>
                <CardHeader>
                  <div className='flex items-center gap-3 mb-2'>
                    <Users className='h-5 w-5 text-primary' />
                    <CardTitle className='text-lg'>
                      Platform / DevOps engineers
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground'>
                    Managing GitHub Actions at scale
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <div className='flex items-center gap-3 mb-2'>
                    <Building2 className='h-5 w-5 text-primary' />
                    <CardTitle className='text-lg'>
                      Large monorepo teams
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground'>
                    Heavy CI workloads requiring control
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <div className='flex items-center gap-3 mb-2'>
                    <Lock className='h-5 w-5 text-primary' />
                    <CardTitle className='text-lg'>
                      Security-conscious orgs
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground'>
                    Stronger security / compliance guarantees
                  </p>
                </CardContent>
              </Card>
            </div>

            <h2 className='text-3xl md:text-4xl font-bold text-center mb-12'>
              FAQ
            </h2>
            <div className='space-y-6'>
              <Card>
                <CardHeader>
                  <div className='flex items-center gap-3'>
                    <MessageSquare className='h-5 w-5 text-primary' />
                    <CardTitle className='text-lg'>
                      Why not just use GitHub-hosted runners?
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground'>
                    GitHub-hosted runners are great for most use cases, but
                    self-hosted runners give you control over costs, security
                    boundaries, and compliance requirements. This solution makes
                    self-hosted runners as easy as hosted ones, without the
                    operational overhead.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className='flex items-center gap-3'>
                    <MessageSquare className='h-5 w-5 text-primary' />
                    <CardTitle className='text-lg'>
                      Can I run this outside AWS?
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground'>
                    Currently, this is built specifically for AWS using ECS
                    Fargate. The architecture could be adapted for other
                    platforms, but AWS is the primary target.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className='flex items-center gap-3'>
                    <MessageSquare className='h-5 w-5 text-primary' />
                    <CardTitle className='text-lg'>
                      What does it cost roughly?
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground'>
                    For 100 workflows/month with 30-minute average runtime,
                    expect ~$2-3/month in ECS costs. You only pay when runners
                    are active—zero idle costs.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className='flex items-center gap-3'>
                    <MessageSquare className='h-5 w-5 text-primary' />
                    <CardTitle className='text-lg'>
                      How does cleanup and reliability work?
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground'>
                    Runners automatically deregister and terminate when
                    workflows complete. We use queues, idempotency checks, and
                    reconciliation jobs to handle edge cases. CloudWatch alarms
                    and dashboards provide full observability.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className='flex items-center gap-3'>
                    <MessageSquare className='h-5 w-5 text-primary' />
                    <CardTitle className='text-lg'>
                      Is this production-ready or experimental?
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground'>
                    This is production-ready and battle-tested in a healthcare
                    EMR platform. It includes comprehensive monitoring,
                    alerting, security controls, and reliability features.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='border-t py-8'>
        <div className='container mx-auto px-4'>
          <div className='mx-auto max-w-6xl'>
            <div className='text-center space-y-4'>
              <div className='flex items-center justify-center gap-4 text-sm text-muted-foreground'>
                <span>Open Source · MIT License</span>
                <span>·</span>
                <span>Production-ready</span>
              </div>
              <p className='text-sm text-muted-foreground'>
                Built and battle-tested in a healthcare EMR platform
              </p>
              <p className='text-xs text-muted-foreground pt-2'>
                Built with AWS (ECS, Lambda, API Gateway, VPC), SST, TypeScript
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
