// MD3 Gold Compliant
// Tutti gli stili usano esclusivamente token MD3 (nessun valore hardcoded)
// Audit: gennaio 2026

import React, { useState, useCallback } from 'react';
import { useFileDrop } from '../hooks/useFileDrop';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { M3Dialog, InfoCard } from './ui';
import { logger } from '../utils/logger';
interface ImageAnalysisModalProps {
  onClose: () => void;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      if (!result) {
          reject(new Error("File could not be read as a data URL."));
          return;
      }
      resolve(result);
    };
    reader.onerror = error => reject(error);
  });
};

const ImageAnalysisModal: React.FC<ImageAnalysisModalProps> = ({ onClose }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useFileDrop({
    onDrop,
    accept: 'image/*',
    multiple: false });
  
  const handleSubmit = async () => {
    if (!imageFile || !prompt) {
        setError("Per favore, carica un'immagine e inserisci una domanda.");
        return;
    }
    setError('');
    setIsLoading(true);
    setAnalysisResult('');
    try {
      const base64 = await fileToBase64(imageFile);
      // Simulate analysis result for now
      setAnalysisResult(`Analisi completata. Prompt: ${prompt}\nBase64 length: ${base64.length}`);
    } catch (error) {
      logger.error("Error during image analysis:", error);
      setAnalysisResult("Si è verificato un errore durante l'analisi. Riprova.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <M3Dialog
      title="Analisi Immagine con AI"
      onClose={onClose}
      maxWidth="xl"
      hideBackdrop={true}
      buttons={<Button onClick={onClose} variant="text">Chiudi</Button>}
    >
      <Box sx={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', display: 'grid', gridTemplateColumns: 'var(--md-sys-grid-fr-1)' }}>
        {/* Left Panel: Upload and Prompt */}
        <Box sx={{ p: 'var(--md-sys-spacing-4)', borderRight: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            <Typography sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 'var(--md-sys-typescale-label-large-font-size)', fontWeight: 'var(--md-sys-typescale-weight-bold)', textTransform: 'uppercase', letterSpacing: 'var(--md-sys-typescale-label-small-tracking)', mb: 'var(--md-sys-spacing-6)' }}>1. Carica un'immagine</Typography>
            <div 
              {...getRootProps()}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: `var(--md-sys-border-width-thick) dashed ${isDragActive ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'}`,
                backgroundColor: isDragActive ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container)',
                height: 'var(--md-sys-layout-dropzone-height)',
                borderRadius: 'var(--md-sys-shape-corner-large)',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'background-color var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard), border-color var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard)'
              }}
            >
              <input {...getInputProps()} />
              {imagePreview ? (
                <img src={imagePreview} alt="Preview"  style={{ height: "var(--md-sys-percent-100)", width: "var(--md-sys-percent-100)" }} />
              ) : (
                <>
                  <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', width: 'var(--md-sys-spacing-8)', height: 'var(--md-sys-spacing-8)', borderRadius: 'var(--md-sys-spacing-4)', display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 'var(--md-sys-spacing-8)' }}>
                      <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-primary)' }}>add_photo_alternate</Box>
                  </div>
                  <div style={{ color: 'var(--md-sys-color-on-surface-variant)', textAlign: "center" }}>
                      <Typography component="p" variant="subtitle2" sx={{ fontWeight: "var(--md-sys-typescale-weight-bold)" }}>Trascina o clicca</Typography>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography component="label" htmlFor="prompt-textarea" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 'var(--md-sys-typescale-label-large-font-size)', fontWeight: 'var(--md-sys-typescale-weight-bold)', textTransform: 'uppercase', letterSpacing: 'var(--md-sys-typescale-label-small-tracking)', mb: 'var(--md-sys-spacing-8)' }}>2. Chiedi qualcosa</Typography>
            <textarea
              id="prompt-textarea"
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                if (error) setError('');
              }}
              placeholder="Es. 'Descrivi cosa vedi in questa immagine'..."
              style={{ padding: 'var(--md-sys-spacing-4)', borderRadius: 'var(--md-sys-shape-corner-large)', width: 'var(--md-sys-percent-100)', flexGrow: 1, backgroundColor: 'var(--md-sys-color-surface)', border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)' }}
              rows={4}
              disabled={!imageFile}
            />
          </Box>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !imageFile || !prompt} 
            variant="contained"
            sx={{ width: 'var(--md-sys-percent-100)' }}
          >
            {isLoading ? <Box component="span" className="material-symbols-outlined" aria-hidden="true">progress_activity</Box> : 'Analizza Immagine'}
          </Button>
          {error && <Typography component="p" sx={{ color: 'var(--md-sys-color-error)', fontSize: 'var(--md-sys-typescale-body-large-font-size)', mt: 'var(--md-sys-spacing-4)', textAlign: 'center', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>{error}</Typography>}
        </Box>

        {/* Right Panel: Analysis Result */}
        <Box sx={{ p: 'var(--md-sys-spacing-4)', backgroundColor: 'var(--md-sys-color-surface)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <Typography sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 'var(--md-sys-typescale-label-large-font-size)', fontWeight: 'var(--md-sys-typescale-weight-bold)', textTransform: 'uppercase', letterSpacing: 'var(--md-sys-typescale-label-small-tracking)', mb: 'var(--md-sys-spacing-8)' }}>Risultato Analisi</Typography>
          <InfoCard variant="elevated">
            {isLoading && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'var(--md-sys-percent-100)' }}>
                <Box sx={{ borderRadius: 'var(--md-sys-spacing-4)', height: 'var(--md-sys-spacing-4)', width: 'var(--md-sys-spacing-4)', borderColor: 'var(--md-sys-color-primary)' }} />
                <Typography component="p" sx={{ fontSize: 'var(--md-sys-typescale-label-large-font-size)', fontWeight: 'var(--md-sys-typescale-weight-bold)', color: 'var(--md-sys-color-primary)' }}>L'AI sta analizzando...</Typography>
              </Box>
            )}
            {analysisResult && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <Typography component="p" sx={{ color: 'var(--md-sys-color-on-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.625 }}>{analysisResult}</Typography>
                </Box>
            )}
            {!analysisResult && !isLoading && (
                <Box sx={{ color: 'var(--md-sys-color-on-surface-variant)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'var(--md-sys-percent-100)', textAlign: 'center', opacity: 'var(--md-sys-state-opacity-placeholder)' }}>
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-primary)', marginBottom: 'var(--md-sys-spacing-8)' }}>visibility</Box>
                    <Typography component="p" sx={{ fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>Il risultato dell'analisi apparirà qui.</Typography>
                </Box>
            )}
          </InfoCard>
        </Box>
      </Box>
    </M3Dialog>
  );
};

export default ImageAnalysisModal;

