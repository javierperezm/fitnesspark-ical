export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { NodeSDK } = await import('@opentelemetry/sdk-node')
    const { OTLPTraceExporter } = await import(
      '@opentelemetry/exporter-trace-otlp-http'
    )
    const { getNodeAutoInstrumentations } = await import(
      '@opentelemetry/auto-instrumentations-node'
    )
    const { Resource } = await import('@opentelemetry/resources')
    const { ATTR_SERVICE_NAME, ATTR_DEPLOYMENT_ENVIRONMENT_NAME } =
      await import('@opentelemetry/semantic-conventions')

    const sdk = new NodeSDK({
      resource: new Resource({
        [ATTR_SERVICE_NAME]:
          process.env.OTEL_SERVICE_NAME || 'fitnesspark-ical-web',
        [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]:
          process.env.NODE_ENV || 'development',
      }),
      traceExporter: new OTLPTraceExporter({
        url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318'}/v1/traces`,
      }),
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': { enabled: false },
        }),
      ],
    })

    sdk.start()
  }
}
