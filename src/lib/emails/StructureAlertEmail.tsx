import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

import { HtmlValidationResult } from '@/types'

interface StructureAlertEmailProps {
  failures: HtmlValidationResult[]
}

export default function StructureAlertEmail({
  failures,
}: StructureAlertEmailProps) {
  const affectedShops = [...new Set(failures.map((f) => f.shop))]
  const totalErrors = failures.reduce((acc, f) => acc + f.errors.length, 0)

  return (
    <Html>
      <Head />
      <Preview>
        {`HTML Structure Alert: ${totalErrors} errors detected in ${failures.length} validations`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Fitnesspark iCal - Structure Alert</Heading>

          <Section style={alertSection}>
            <Text style={alertText}>
              The HTML structure of Fitnesspark has changed. The scraper may not
              be working correctly.
            </Text>
          </Section>

          <Section style={summarySection}>
            <Text style={summaryTitle}>Summary</Text>
            <Text style={summaryItem}>
              <strong>Detection time:</strong>{' '}
              {failures[0]?.timestamp.toISOString()}
            </Text>
            <Text style={summaryItem}>
              <strong>Affected shops:</strong> {affectedShops.join(', ')}
            </Text>
            <Text style={summaryItem}>
              <strong>Total errors:</strong> {totalErrors}
            </Text>
          </Section>

          <Hr style={hr} />

          {failures.map((failure, index) => (
            <Section key={index} style={failureSection}>
              <Text style={shopTitle}>Shop {failure.shop}</Text>

              {failure.errors.map((error, errIndex) => (
                <Section key={errIndex} style={errorSection}>
                  <Text style={errorCode}>[{error.code}]</Text>
                  <Text style={errorMessage}>{error.message}</Text>
                  {error.selector && (
                    <Text style={errorDetail}>
                      <strong>Selector:</strong> {error.selector}
                    </Text>
                  )}
                  {error.expected && (
                    <Text style={errorDetail}>
                      <strong>Expected:</strong> {error.expected}
                    </Text>
                  )}
                  {error.actual && (
                    <Text style={errorDetail}>
                      <strong>Actual:</strong> {error.actual}
                    </Text>
                  )}
                </Section>
              ))}

              {failure.rawHtmlSample && (
                <Section style={htmlSampleSection}>
                  <Text style={htmlSampleTitle}>HTML Sample (first 500 chars)</Text>
                  <Text style={htmlSample}>{failure.rawHtmlSample}</Text>
                </Section>
              )}
            </Section>
          ))}

          <Hr style={hr} />

          <Text style={footer}>
            This is an automated alert from Fitnesspark iCal scraper.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.25',
  padding: '0 48px',
}

const alertSection = {
  backgroundColor: '#fef2f2',
  borderLeft: '4px solid #dc2626',
  margin: '24px 48px',
  padding: '16px',
}

const alertText = {
  color: '#991b1b',
  fontSize: '14px',
  margin: '0',
}

const summarySection = {
  padding: '0 48px',
}

const summaryTitle = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '600',
  marginBottom: '8px',
}

const summaryItem = {
  color: '#4b5563',
  fontSize: '14px',
  margin: '4px 0',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 48px',
}

const failureSection = {
  padding: '0 48px',
  marginBottom: '24px',
}

const shopTitle = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '600',
  marginBottom: '12px',
}

const errorSection = {
  backgroundColor: '#f9fafb',
  borderRadius: '4px',
  padding: '12px',
  marginBottom: '8px',
}

const errorCode = {
  color: '#dc2626',
  fontSize: '12px',
  fontFamily: 'monospace',
  margin: '0 0 4px 0',
}

const errorMessage = {
  color: '#1f2937',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0 0 8px 0',
}

const errorDetail = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '2px 0',
}

const htmlSampleSection = {
  marginTop: '12px',
}

const htmlSampleTitle = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '600',
  marginBottom: '4px',
}

const htmlSample = {
  backgroundColor: '#1f2937',
  color: '#e5e7eb',
  fontFamily: 'monospace',
  fontSize: '10px',
  padding: '12px',
  borderRadius: '4px',
  whiteSpace: 'pre-wrap' as const,
  wordBreak: 'break-all' as const,
  overflow: 'hidden',
}

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  padding: '0 48px',
}
