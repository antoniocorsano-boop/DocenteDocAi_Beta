import React, { useState } from 'react';
import Logo from './Logo';
import { SCHOOL_TYPES_DISCIPLINES } from '../constants';
import { ActionTile, InfoCard, TextField } from './ui';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import type { SelectChangeEvent } from '@mui/material/Select';
import ContextualAskAI from './ui/ContextualAskAI';
import { View } from '../types';

interface WelcomeScreenProps {
  onSetupComplete: (data: { name: string; schoolType?: string; firstClass?: string; isGuided: boolean }) => void;
  onNavigate?: (view: View, context?: any) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSetupComplete, onNavigate }) => {
  const [mode, setMode] = useState<'selection' | 'wizard' | 'quick'>('selection');
  
  // Wizard State
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [schoolType, setSchoolType] = useState(Object.keys(SCHOOL_TYPES_DISCIPLINES)[0]);
  const [className, setClassName] = useState('');

  const handleWizardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSetupComplete({ 
        name, 
        schoolType, 
        firstClass: className, 
        isGuided: true 
    });
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (name.trim()) {
          onSetupComplete({ 
              name, 
              isGuided: false 
          });
      }
  };

  const renderSelection = () => (
            <div
                style={{
                    width: 'var(--md-sys-percent-100)',
                    padding: 'var(--md-sys-spacing-8)',
                    border: 'var(--md-sys-spacing-0) solid var(--md-sys-color-outline)',
                    backgroundColor: 'var(--md-sys-color-surface)',
                    borderRadius: 'var(--md-sys-shape-corner-large)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                }}
            >
                    <div
                        style={{
                            padding: 'var(--md-sys-spacing-6)',
                            border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)',
                            borderRadius: 'var(--md-sys-shape-corner-medium)',
                            backgroundColor: 'var(--md-sys-color-surface-container-low)',
                        }}
                    >
            <Logo />
          </div>
          <Typography variant="h4" sx={{marginBottom: 'var(--md-sys-spacing-8)'}}>Benvenuto, Docente</Typography>
          <Typography variant="body1" sx={{textTransform: "uppercase"}}>
              Configuriamo il tuo spazio di lavoro
          </Typography>

          <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'var(--md-sys-grid-fr-1)',
                            gap: 'var(--md-sys-spacing-6)',
                            width: 'var(--md-sys-percent-100)',
                        }}
                    >
              <ActionTile 
                title="Wizard Guidato"
                subtitle="Passo dopo passo"
                icon="auto_fix_high"
                variant="contained"
                onClick={() => setMode('wizard')}
                // eslint-disable-next-line no-restricted-syntax
 style={{ transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)' }}
              />
              <ActionTile 
                title="Accesso Rapido"
                subtitle="Configurazione manuale"
                icon="bolt"
                variant="surface"
                onClick={() => setMode('quick')}
                // eslint-disable-next-line no-restricted-syntax
 style={{ transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)' }}
              />
          </div>

          {onNavigate && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <ContextualAskAI
                onNavigate={onNavigate}
                context={{ source: 'welcome' }}
               
                compact
              />
            </Box>
          )}
          
          <InfoCard 
            title="I tuoi dati sono al sicuro"
            description="Tutto ciò che inserisci rimane salvato localmente sul tuo dispositivo. Nessun dato personale viene inviato ai nostri server."
            icon="security"
            variant="surface"

          />
      </div>
  );

  const renderWizard = () => (
        <form
            onSubmit={handleWizardSubmit}
            style={{
                width: 'var(--md-sys-percent-100)',
                padding: 'var(--md-sys-spacing-8)',
                border: 'var(--md-sys-spacing-0) solid var(--md-sys-color-outline)',
                borderRadius: 'var(--md-sys-shape-corner-large)',
                backgroundColor: 'var(--md-sys-color-surface)',
            }}
        >
        <div style={{ width: 'var(--md-sys-percent-100)' }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <IconButton aria-label="Indietro" onClick={() => { if(step > 1) setStep(s => s-1); else setMode('selection'); }}><Box component="span" className="material-symbols-outlined" aria-hidden="true">arrow_back</Box></IconButton>
                <Typography variant="overline" sx={{ color: 'var(--md-sys-color-primary)', textTransform: 'uppercase' }}>Passo {step} di 3</Typography>
                <div style={{ width: 'var(--md-sys-spacing-4)' }}></div>
            </div>
            
            {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <TextField 
                        id="wizard-name"
                       
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Es. Prof. Rossi"
                        autoFocus
                    />
                </div>
            )}

            {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                        <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel id="wizard-school-type-label" shrink>Tipo di Scuola</InputLabel>
                      <Select
                        labelId="wizard-school-type-label"
                        value={schoolType}
                       
                        notched
                        onChange={(e: SelectChangeEvent) => setSchoolType(e.target.value)}
                      >
                        {Object.keys(SCHOOL_TYPES_DISCIPLINES).map(t => (
                          <MenuItem key={t} value={t}>{t}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                marginTop: 'var(--md-sys-spacing-4)',
                                                paddingLeft: 'var(--md-sys-spacing-4)',
                                                paddingRight: 'var(--md-sys-spacing-4)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.1em',
                                            }}
                                        >
                                            Servirà per suggerire le materie corrette.
                                        </Typography>
                </div>
            )}

            {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <TextField 
                        id="wizard-class-name"
                       
                        value={className}
                        onChange={(e) => setClassName(e.target.value.toUpperCase())}
                        placeholder="Es. 3A"
                        autoFocus

                    />
                </div>
            )}
        </div>

        <div style={{ width: 'var(--md-sys-percent-100)' }}>
            {step < 3 ? (
                                <Button
                                    type="button"
                                    variant="contained"
                                    sx={{ width: 'var(--md-sys-percent-100)', textTransform: 'uppercase' }}
                                    onClick={() => setStep(s => s + 1)}
                                    disabled={(step === 1 && !name) || (step === 3 && !className)}
                                    aria-label="Continua"
                                >
                                    Continua
                                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontWeight: 'var(--md-sys-typescale-weight-black)', fontSize: 'var(--md-sys-typescale-label-large-font-size)', marginLeft: 'var(--md-sys-spacing-3)' }}>arrow_forward</Box>
                                </Button>
            ) : (
                                <Button
                                    type="submit"
                                    variant="contained"
                                    sx={{ width: 'var(--md-sys-percent-100)', textTransform: 'uppercase' }}
                                    disabled={!className}
                                    aria-label="Inizia Ora"
                                >
                                    Inizia Ora
                                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontWeight: 'var(--md-sys-typescale-weight-black)', fontSize: 'var(--md-sys-typescale-label-large-font-size)', marginLeft: 'var(--md-sys-spacing-3)' }}>check</Box>
                                </Button>
            )}
        </div>
    </form>
  );

  const renderQuick = () => (
            <form
                onSubmit={handleQuickSubmit}
                style={{
                    width: 'var(--md-sys-percent-100)',
                    padding: 'var(--md-sys-spacing-8)',
                    border: 'var(--md-sys-spacing-0) solid var(--md-sys-color-outline)',
                    borderRadius: 'var(--md-sys-shape-corner-large)',
                    backgroundColor: 'var(--md-sys-color-surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                }}
            >
            <IconButton aria-label="Indietro" onClick={() => setMode('selection')}><Box component="span" className="material-symbols-outlined" aria-hidden="true">arrow_back</Box></IconButton>
          
                    <div
                        style={{
                            padding: 'var(--md-sys-spacing-6)',
                            border: 'var(--md-sys-spacing-0) solid var(--md-sys-color-outline)',
                            borderRadius: 'var(--md-sys-shape-corner-medium)',
                            backgroundColor: 'var(--md-sys-color-surface-container-low)',
                        }}
                    >
            <Logo />
          </div>
          
          <Typography variant="h4" sx={{marginBottom: 'var(--md-sys-spacing-8)'}}>Accesso Rapido</Typography>
          <Typography variant="body1" sx={{textTransform: "uppercase"}}>Configurazione manuale</Typography>
          
          <div style={{ width: "var(--md-sys-percent-100)" }}>
            <TextField 
                id="quick-name"
               
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Es. Prof. Rossi"
                required
                autoFocus

            />
          </div>

                        <Button
                            type="submit"
                            variant="contained"
                            sx={{ width: 'var(--md-sys-percent-100)', textTransform: 'uppercase' }}
                            aria-label="Entra nella Dashboard"
                            endIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">login</Box>}
                        >
                            Entra nella Dashboard
                        </Button>
      </form>
  );

  return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--md-sys-color-surface)',
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                overflow: 'hidden',
            }}
        >
        {/* Aura Ornaments */}
                <div
                    style={{
                        borderRadius: 'var(--md-sys-shape-corner-large)',
                        position: 'absolute',
                        top: 'calc(var(--md-sys-percent-10) * -1)',
                        left: 'calc(var(--md-sys-percent-10) * -1)',
                        width: 'var(--md-sys-percent-40)',
                        height: 'var(--md-sys-percent-40)',
                        background: 'var(--md-sys-color-primary)',
                        opacity: 'var(--md-sys-state-opacity-tint-faint)',
                        filter: 'blur(var(--md-sys-blur-120))',
                        animation: 'pulse var(--md-sys-motion-duration-long) infinite',
                    }}
                ></div>
                <div
                    style={{
                        borderRadius: 'var(--md-sys-shape-corner-large)',
                        position: 'absolute',
                        bottom: 'calc(var(--md-sys-percent-10) * -1)',
                        right: 'calc(var(--md-sys-percent-10) * -1)',
                        width: 'var(--md-sys-percent-40)',
                        height: 'var(--md-sys-percent-40)',
                        background: 'var(--md-sys-color-secondary)',
                        opacity: 'var(--md-sys-state-opacity-tint-faint)',
                        filter: 'blur(var(--md-sys-blur-120))',
                        animation: 'pulse var(--md-sys-motion-duration-long) infinite',
                    }}
                ></div>
                <div
                    style={{
                        borderRadius: 'var(--md-sys-shape-corner-large)',
                        position: 'absolute',
                        top: 'var(--md-sys-percent-50)',
                        left: 'var(--md-sys-percent-50)',
                        transform: 'translate(-50%, -50%)',
                        width: 'var(--md-sys-percent-60)',
                        height: 'var(--md-sys-percent-60)',
                        background: 'var(--md-sys-color-tertiary)',
                        opacity: 'var(--md-sys-state-opacity-tint-hairline)',
                        filter: 'blur(var(--md-sys-blur-150))',
                    }}
                ></div>

        {mode === 'selection' && renderSelection()}
        {mode === 'wizard' && renderWizard()}
        {mode === 'quick' && renderQuick()}
    </div>
  );
};

export default WelcomeScreen;

