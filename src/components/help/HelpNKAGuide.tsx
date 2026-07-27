import React from 'react';
import Typography from '@mui/material/Typography';
import { InfoCard } from '../ui';

const HelpNKAGuide: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-6)', padding: 'var(--md-sys-spacing-4)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-4)', marginBottom: 'var(--md-sys-spacing-2)' }}>
      <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 'var(--md-sys-typescale-headline-medium-font-size)', color: 'var(--md-sys-color-primary)' }}>auto_awesome</span>
      <div>
        <Typography variant="h6" sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-black)' }}>NKA Aura — Mappa Neurale</Typography>
        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', marginTop: 'var(--md-sys-spacing-1)' }}>Neural Knowledge Architecture</Typography>
      </div>
    </div>

    <InfoCard title="Cos'è Aura?" icon="psychology">
      <Typography variant="body2">Aura è la tua mappa della conoscenza personale. Connette automaticamente concetti, discipline e risorse che hai esplorato, creando una rete visiva del tuo sapere didattico.</Typography>
    </InfoCard>

    <InfoCard title="Come aprire Aura" icon="touch_app">
      <Typography variant="body2" sx={{ marginBottom: 'var(--md-sys-spacing-3)' }}>Il pulsante <strong>Aura</strong> (<span aria-hidden="true" className="material-symbols-outlined" style={{ verticalAlign: 'middle' }}>auto_awesome</span>) si trova nell&apos;header in alto a destra.</Typography>
      <ul style={{ paddingLeft: 'var(--md-sys-spacing-5)', display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-2)' }}>
        <li><Typography variant="body2"><strong>Tap breve</strong> → apre la mappa neurale interattiva</Typography></li>
        <li><Typography variant="body2"><strong>Pressione lunga (500ms)</strong> → apre le opzioni avanzate di Aura</Typography></li>
      </ul>
    </InfoCard>

    <InfoCard title="Nodi e connessioni" icon="hub">
      <Typography variant="body2" sx={{ marginBottom: 'var(--md-sys-spacing-3)' }}>La mappa è composta da <strong>nodi</strong> (concetti, classi, discipline) e <strong>connessioni</strong> (relazioni semantiche tra di essi).</Typography>
      <Typography variant="body2">Quando appare il pallino colorato sul pulsante Aura, significa che un <strong>nuovo nodo è disponibile</strong> da esplorare.</Typography>
    </InfoCard>

    <InfoCard title="Suoni e feedback aptico" icon="vibration">
      <Typography variant="body2">Aura utilizza micro-suoni e vibrazione (su dispositivi compatibili) per confermare le interazioni. I suoni possono essere disabilitati dalle Impostazioni.</Typography>
    </InfoCard>

    <InfoCard title="Privacy e dati" icon="lock">
      <Typography variant="body2">La mappa neurale è elaborata localmente sul tuo dispositivo. Nessun dato della mappa viene inviato a server esterni.</Typography>
    </InfoCard>
  </div>
);

export default HelpNKAGuide;
