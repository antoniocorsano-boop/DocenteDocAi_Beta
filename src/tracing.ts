import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { BatchSpanProcessor, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { trace, type Tracer } from '@opentelemetry/api';

const TRACER_NAME = 'docentedoc-ai';

const otlpEndpoint = import.meta.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT as string | undefined;

// If no endpoint is configured, skip tracing initialisation entirely
if (otlpEndpoint) {
  const traceExporter = new OTLPTraceExporter({ url: otlpEndpoint });

  const spanProcessors = [
    new BatchSpanProcessor(traceExporter),
    // Console output only in development to avoid noise in production
    ...(import.meta.env.DEV ? [new SimpleSpanProcessor(new ConsoleSpanExporter())] : []),
  ];

  const provider = new WebTracerProvider({ spanProcessors });
  provider.register();
}

/**
 * Returns the application-scoped OTel Tracer.
 *
 * When no OTLP endpoint is configured the tracer is a no-op proxy —
 * callers can use it safely without wrapping in conditionals.
 */
export function getTracer(): Tracer {
  return trace.getTracer(TRACER_NAME);
}

