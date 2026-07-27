/**
 * builtinWorkflows.ts — Registration of built-in event-driven workflows.
 *
 * Call `registerBuiltinWorkflows()` once at app boot (before WorkflowEngine.start()).
 * Each workflow is pure: it uses the WorkflowContext API, not direct Zustand access.
 */

import { WorkflowRegistry } from './WorkflowRegistry';
import { logger } from '../../utils/logger';

/**
 * Register all built-in workflows.
 * Safe to call multiple times — skips already-registered workflows.
 */
export function registerBuiltinWorkflows(): void {
    // ── lesson.created ────────────────────────────────────────────────────────
    if (!WorkflowRegistry.hasForEvent('lesson.created')) {
        WorkflowRegistry.register({
            id: 'builtin.lesson.created.log',
            trigger: 'lesson.created',
            description: 'Log lesson creation and nudge analytics update',
            steps: [
                {
                    id: 'log-lesson',
                    fn: (ctx) => {
                        const payload = ctx.payload as { lessonId?: string };
                        ctx.log(`New lesson created — id: ${String(payload.lessonId ?? 'unknown')}`, 'info');
                    },
                    timeout: 500,
                },
                {
                    id: 'emit-analytics',
                    fn: (ctx) => {
                        ctx.emit('analytics.viewed', {});
                        ctx.log('Analytics update triggered', 'debug');
                    },
                    timeout: 1_000,
                },
            ],
        });
    }

    // ── evaluation.added ──────────────────────────────────────────────────────
    if (!WorkflowRegistry.hasForEvent('evaluation.added')) {
        WorkflowRegistry.register({
            id: 'builtin.evaluation.added.log',
            trigger: 'evaluation.added',
            description: 'Log evaluation and emit analytics signal',
            steps: [
                {
                    id: 'log-evaluation',
                    fn: (ctx) => {
                        const payload = ctx.payload as { studentId?: string };
                        ctx.log(`Evaluation added — student: ${String(payload.studentId ?? 'unknown')}`, 'info');
                    },
                    timeout: 500,
                },
                {
                    id: 'emit-analytics',
                    fn: (ctx) => {
                        ctx.emit('analytics.viewed', {});
                    },
                    timeout: 1_000,
                },
            ],
        });
    }

    // ── uda.created ───────────────────────────────────────────────────────────
    if (!WorkflowRegistry.hasForEvent('uda.created')) {
        WorkflowRegistry.register({
            id: 'builtin.uda.created.log',
            trigger: 'uda.created',
            description: 'Log UDA creation',
            steps: [
                {
                    id: 'log-uda',
                    fn: (ctx) => {
                        const payload = ctx.payload as { udaId?: string };
                        ctx.log(`UDA created — id: ${String(payload.udaId ?? 'unknown')}`, 'info');
                    },
                    timeout: 500,
                },
            ],
        });
    }

    // ── drive.backup.saved ────────────────────────────────────────────────────
    if (!WorkflowRegistry.hasForEvent('drive.backup.saved')) {
        WorkflowRegistry.register({
            id: 'builtin.drive.backup.saved.log',
            trigger: 'drive.backup.saved',
            description: 'Log successful Drive backup',
            steps: [
                {
                    id: 'log-backup',
                    fn: (ctx) => { ctx.log('Drive backup saved successfully', 'info'); },
                    timeout: 500,
                },
            ],
        });
    }

    // ── student.risk.changed ──────────────────────────────────────────────────
    if (!WorkflowRegistry.hasForEvent('student.risk.changed')) {
        WorkflowRegistry.register({
            id: 'builtin.student.risk.changed',
            trigger: 'student.risk.changed',
            description: 'Trigger copilot suggestion when a student risk level changes',
            steps: [
                {
                    id: 'log-risk-change',
                    fn: (ctx) => {
                        const payload = ctx.payload as { studentId?: string; risk?: string };
                        ctx.log(`Student risk changed — student: ${String(payload.studentId ?? 'unknown')} → ${String(payload.risk ?? 'unknown')}`, 'info');
                    },
                    timeout: 500,
                },
                {
                    id: 'emit-copilot-suggestion',
                    fn: (ctx) => {
                        // Emit a signal for the Copilot to pick up and generate a suggestion
                        ctx.emit('copilot.suggestion.accepted', {});
                        ctx.log('Copilot suggestion requested for at-risk student', 'debug');
                    },
                    timeout: 1_000,
                },
            ],
        });
    }

    logger.debug('[WorkflowEngine] Built-in workflows registered:', WorkflowRegistry.ids());
}
