'use client'

import { useState } from 'react'
import { type ObjectInputProps, useFormValue } from 'sanity'
import { Button, Flex, Stack, Text, Card, Inline, Box, Badge } from '@sanity/ui'
import { SparklesIcon, ResetIcon } from '@sanity/icons'

type GenerateStep = 'idle' | 'generating' | 'uploading' | 'done' | 'error'

const stepLabels: Record<GenerateStep, string> = {
  idle: '',
  generating: 'Afbeelding genereren...',
  uploading: 'Uploaden naar Sanity...',
  done: 'Klaar!',
  error: 'Fout',
}

export function GenerateImageInput(props: ObjectInputProps) {
  const [step, setStep] = useState<GenerateStep>('idle')
  const [errorText, setErrorText] = useState('')

  const documentId = useFormValue(['_id']) as string | undefined
  const imagePrompt = useFormValue(['imagePrompt']) as string | undefined

  const isLoading = step === 'generating' || step === 'uploading'

  const handleGenerate = async () => {
    if (!documentId || !imagePrompt) return

    setStep('generating')
    setErrorText('')

    try {
      const cleanId = documentId.replace(/^drafts\./, '')

      const res = await fetch('/api/studio/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: cleanId, prompt: imagePrompt }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `Fout ${res.status}`)
      }

      setStep('uploading')
      await new Promise((r) => setTimeout(r, 800))
      setStep('done')
    } catch (err: any) {
      setStep('error')
      setErrorText(err.message || 'Onbekende fout')
    }
  }

  return (
    <Stack space={3}>
      {props.renderDefault(props)}

      <Card
        padding={4}
        radius={3}
        tone={step === 'error' ? 'critical' : step === 'done' ? 'positive' : 'default'}
        border
        style={{ borderStyle: imagePrompt ? 'solid' : 'dashed' }}
      >
        <Stack space={3}>
          {/* Header */}
          <Flex align="center" gap={2}>
            <SparklesIcon />
            <Text size={1} weight="bold">AI Afbeelding Generator</Text>
            {step !== 'idle' && step !== 'error' && (
              <Box flex={1} style={{ textAlign: 'right' }}>
                <Badge tone={step === 'done' ? 'positive' : 'primary'} fontSize={0}>
                  {stepLabels[step]}
                </Badge>
              </Box>
            )}
          </Flex>

          {/* Prompt preview */}
          {imagePrompt && step === 'idle' && (
            <Card padding={2} radius={2} tone="transparent" style={{ background: 'var(--card-code-bg-color)' }}>
              <Text size={1} muted style={{ fontStyle: 'italic' }}>
                &ldquo;{imagePrompt.length > 120 ? imagePrompt.slice(0, 120) + '...' : imagePrompt}&rdquo;
              </Text>
            </Card>
          )}

          {/* Progress */}
          {isLoading && (
            <Card padding={3} radius={2} tone="primary">
              <Flex align="center" gap={3}>
                <Box
                  style={{
                    width: 18,
                    height: 18,
                    border: '2px solid currentColor',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                <Stack space={2}>
                  <Text size={1} weight="bold">{stepLabels[step]}</Text>
                  <Text size={0} muted>
                    {step === 'generating' ? 'Dit kan 10-30 seconden duren' : 'Bijna klaar...'}
                  </Text>
                </Stack>
              </Flex>
            </Card>
          )}

          {/* Succes */}
          {step === 'done' && (
            <Card padding={3} radius={2} tone="positive">
              <Stack space={3}>
                <Text size={1}>Afbeelding is gegenereerd en gekoppeld aan dit artikel.</Text>
                <Inline space={2}>
                  <Button
                    icon={ResetIcon}
                    text="Pagina verversen"
                    tone="positive"
                    mode="ghost"
                    onClick={() => window.location.reload()}
                    fontSize={1}
                  />
                  <Button
                    text="Opnieuw genereren"
                    tone="default"
                    mode="ghost"
                    onClick={() => { setStep('idle'); setErrorText(''); }}
                    fontSize={1}
                  />
                </Inline>
              </Stack>
            </Card>
          )}

          {/* Error */}
          {step === 'error' && (
            <Card padding={3} radius={2} tone="critical">
              <Stack space={2}>
                <Text size={1}>{errorText}</Text>
                <Button
                  text="Probeer opnieuw"
                  tone="critical"
                  mode="ghost"
                  onClick={() => { setStep('idle'); setErrorText(''); }}
                  fontSize={1}
                />
              </Stack>
            </Card>
          )}

          {/* Generate knop */}
          {step === 'idle' && (
            <Flex align="center" gap={3}>
              <Button
                icon={SparklesIcon}
                text="Genereer met AI"
                tone="primary"
                onClick={handleGenerate}
                disabled={!imagePrompt || !documentId}
                fontSize={1}
                padding={3}
              />
              {!imagePrompt && (
                <Text size={1} muted>
                  Vul eerst het &ldquo;AI Image Prompt&rdquo; veld hierboven in
                </Text>
              )}
            </Flex>
          )}
        </Stack>
      </Card>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Stack>
  )
}
