import React from 'react';
import Typography from '@mui/material/Typography';
import { sanitizeHtml } from '../../utils/htmlSanitizer';

export const specsContentData = {
    title: "Specifiche Tecniche DocenteDoc AI",
    specs: [
        "<strong>Architettura:</strong> PWA Client-Side (React 18 + TypeScript + Zustand).",
        "<strong>Workflow Engine:</strong> Centro Operativo centralizzato con Action Tiles M3 Expressive.",
        "<strong>Storage Ibrido:</strong> IndexedDB (File/KB) + LocalStorage (Dati rapidi) con backup automatico.",
        "<strong>Cloud Sync:</strong> Integrazione Google Drive API (OAuth 2.0) per backup snapshot crittografato.",
        "<strong>Design System:</strong> M3 Expressive con layout adattivo, motion system e Zero-FOUC.",
        "<strong>AI Engine:</strong> Google Gemini 2.0 Pro & Flash per generazione testo/visione e Search Grounding."
    ]
};

const HelpTechnicalSpecs: React.FC = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
        <Typography variant="button" sx={{
            color: 'var(--md-sys-color-on-surface)'
        }}>{specsContentData.title}</Typography>
        <div style={{
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderRadius: 'var(--md-sys-shape-corner-extra-large)',
            padding: 'var(--md-sys-spacing-4)'
        }}>
            <ul style={{marginTop: 'var(--md-sys-spacing-4)'}}>
                {specsContentData.specs.map((spec, index) => (
                    <li key={index} style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 'var(--md-sys-spacing-2)'
                    }}>
                        <span style={{
                            color: 'var(--md-sys-color-primary)',
                            flexShrink: 0
                        }}>check_circle</span>
                        <span style={{
                            fontSize: 'var(--md-sys-typescale--font-size)',
                            lineHeight: "1.625"
                        }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(spec) }}></span>
                    </li>
                ))}
            </ul>
        </div>
    </div>
);

export default HelpTechnicalSpecs;
