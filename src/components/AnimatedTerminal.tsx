import { useEffect, useState, useRef, useCallback } from 'react';
import { Github, Clock, Cloud, Zap } from 'lucide-react';

interface TerminalLine {
  id: string;
  prefix: string;
  service: string;
  message: string;
  delay: number;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const terminalLines: TerminalLine[] = [
  {
    id: 'github',
    prefix: '>',
    service: 'github:',
    message: 'received workflow_run.queued',
    delay: 0,
    icon: Github,
    label: 'GitHub',
  },
  {
    id: 'scheduler',
    prefix: '>',
    service: 'scheduler:',
    message: 'starting runner for monorepo-ci',
    delay: 800,
    icon: Clock,
    label: 'Scheduler',
  },
  {
    id: 'ecs',
    prefix: '>',
    service: 'ecs:',
    message: 'runTask arn:aws:ecs:...',
    delay: 1600,
    icon: Cloud,
    label: 'ECS Fargate',
  },
  {
    id: 'runner',
    prefix: '>',
    service: 'runner:',
    message: 'registered as self-hosted #47',
    delay: 2400,
    icon: Zap,
    label: 'Runner',
  },
];

const WORKFLOW_DURATION_SECONDS = 7 * 60 + 13; // 7m 13s
const ANIMATION_SPEED = 100; // 100x faster

export function AnimatedTerminal() {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [timer, setTimer] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const timeoutRefs = useRef<number[]>([]);

  const startAnimation = useCallback(() => {
    // Reset state
    setVisibleLines([]);
    setTimer(0);
    setShowCompletion(false);
    setIsRunning(true);

    // Show lines one by one
    for (const line of terminalLines) {
      const timeoutId = window.setTimeout(() => {
        setVisibleLines((prev) => [...prev, line.id]);
      }, line.delay);
      timeoutRefs.current.push(timeoutId);
    }

    // Start timer after all lines are shown
    const timerStartDelay = terminalLines[terminalLines.length - 1].delay + 800;

    const timerTimeoutId = window.setTimeout(() => {
      const startTime = Date.now();
      intervalRef.current = window.setInterval(() => {
        const elapsed = Math.floor(
          ((Date.now() - startTime) * ANIMATION_SPEED) / 1000
        );
        if (elapsed >= WORKFLOW_DURATION_SECONDS) {
          setTimer(WORKFLOW_DURATION_SECONDS);
          setShowCompletion(true);
          setIsRunning(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        } else {
          setTimer(elapsed);
        }
      }, 50); // Update every 50ms for smooth animation
    }, timerStartDelay);
    timeoutRefs.current.push(timerTimeoutId);
  }, []);

  useEffect(() => {
    // Initial animation - use setTimeout to avoid calling setState synchronously
    const initialTimeout = window.setTimeout(() => {
      startAnimation();
    }, 0);

    // Restart animation after completion (30 seconds after completion)
    const timerStartDelay = terminalLines[terminalLines.length - 1].delay + 800;
    const totalDuration =
      timerStartDelay +
      (WORKFLOW_DURATION_SECONDS * 1000) / ANIMATION_SPEED +
      30000;

    const restartTimeoutId = window.setTimeout(() => {
      startAnimation();
    }, totalDuration);
    timeoutRefs.current.push(initialTimeout, restartTimeoutId);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      for (const id of timeoutRefs.current) {
        clearTimeout(id);
      }
      timeoutRefs.current = [];
    };
  }, [startAnimation]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  return (
    <div className='hidden md:block space-y-6'>
      {/* Terminal Panel */}
      <div className='bg-card border-2 rounded-lg overflow-hidden shadow-lg'>
        <div className='bg-muted px-4 py-2 flex items-center gap-2 border-b'>
          <div className='h-2.5 w-2.5 rounded-full bg-red-500' />
          <div className='h-2.5 w-2.5 rounded-full bg-yellow-500' />
          <div className='h-2.5 w-2.5 rounded-full bg-green-500' />
          <span className='ml-2 text-xs text-muted-foreground font-mono'>
            runner-orchestrator
          </span>
        </div>
        <div className='p-6 font-mono text-sm space-y-2 bg-[#0d1117] text-[#c9d1d9] min-h-[200px]'>
          {terminalLines.map((line) => (
            <div
              key={line.id}
              className={`flex items-center gap-2 transition-all duration-300 ${
                visibleLines.includes(line.id)
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 -translate-y-2'
              }`}
            >
              <span className='text-primary'>{line.prefix}</span>
              <span className='text-[#79c0ff]'>{line.service}</span>
              <span>{line.message}</span>
            </div>
          ))}
          {isRunning && timer > 0 && (
            <div className='flex items-center gap-2 pt-2 border-t border-[#30363d] animate-pulse'>
              <span className='text-yellow-500'>⏱</span>
              <span>Running... {formatTime(timer)}</span>
            </div>
          )}
          {showCompletion && (
            <div
              className={`flex items-center gap-2 pt-2 border-t border-[#30363d] transition-all duration-500 ${
                showCompletion
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-2'
              }`}
            >
              <span className='text-green-500'>✓</span>
              <span>
                workflow completed in {formatTime(WORKFLOW_DURATION_SECONDS)} –
                cleanup OK
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Animated Icons Flow */}
      <div className='bg-card border-2 rounded-lg p-6'>
        <div className='flex items-center justify-center gap-4 md:gap-8'>
          {terminalLines.map((line) => {
            const Icon = line.icon;
            const isVisible = visibleLines.includes(line.id);
            const isActive = isVisible && (isRunning || showCompletion);

            return (
              <div key={line.id} className='flex flex-col items-center gap-3'>
                {/* Icon */}
                <div
                  className={`relative transition-all duration-500 ${
                    isVisible
                      ? 'opacity-100 scale-100 translate-y-0'
                      : 'opacity-20 scale-75 translate-y-4'
                  }`}
                >
                  <div
                    className={`p-3 md:p-4 rounded-lg border-2 transition-all duration-500 ${
                      isActive
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                        : isVisible
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-muted bg-muted/50'
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 md:h-8 md:w-8 transition-colors duration-300 ${
                        isActive
                          ? 'text-primary'
                          : isVisible
                          ? 'text-primary/70'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </div>
                  {isActive && (
                    <div className='absolute -top-1 -right-1 h-3 w-3 md:h-4 md:w-4 rounded-full bg-primary animate-ping' />
                  )}
                </div>

                {/* Label */}
                <div
                  className={`text-xs font-medium text-center transition-all duration-300 ${
                    isVisible
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-30 translate-y-2'
                  }`}
                >
                  {line.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
