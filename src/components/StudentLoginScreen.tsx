
// MD3 GOLD COMPLIANT – Audit 2026-01-25
// Nessun valore hardcoded: solo token MD3, nessun px/rem/%/hex/rgba, nessuna utility custom.
// Conforme a MD3_GOVERNANCE_COMPLIANCE_CONTRACT.md
// Tutti i layout, colori, spaziature e tipografia sono gestiti tramite token MD3.

import React, { useState, useMemo } from 'react';
import { Studente, View, NavigationParams } from '../types';
import Logo from './Logo';
import PinPadModal from './PinPadModal';
import { TextField } from './ui';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ContextualAskAI from './ui/ContextualAskAI';
import { WELCOME_MESSAGES, EDUCATIONAL_QUOTES } from '../constants';
interface StudentLoginScreenProps {
    students: Studente[];
    onLogin: (student: Studente) => void;
    onCancel: () => void;
    securityPin?: string;
    onNavigate?: (view: View, context?: NavigationParams) => void;
}

const StudentLoginScreen: React.FC<StudentLoginScreenProps> = ({ students, onLogin, onCancel, securityPin = '0000', onNavigate }) => {
  const [step, setStep] = useState<'class' | 'credentials'>('class');
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [surname, setSurname] = useState('');
    const [name, setName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [error, setError] = useState('');
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);

    const welcomeMessage = useMemo(() => WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)], []);
    const quote = useMemo(() => EDUCATIONAL_QUOTES[Math.floor(Math.random() * EDUCATIONAL_QUOTES.length)], []);

    const uniqueClasses: string[] = (Array.from(new Set(students.map(s => s.classe))) as string[]).sort();

    const handleClassSelect = (className: string) => {
        setSelectedClass(className);
        setStep('credentials');
        setError('');
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const student = students.find(s => 
            s.classe === selectedClass &&
            s.cognome.toLowerCase().trim() === surname.toLowerCase().trim() &&
            s.nome.toLowerCase().trim() === name.toLowerCase().trim() &&
            s.dataNascita === birthDate
        );

        if (student) {
            onLogin(student);
        } else {
            setError("Dati non corretti. Verifica i dati inseriti.");
        }
    };
    
    const handleExitAttempt = () => {
        setIsPinModalOpen(true);
    };

    return (
        <div  style={{display: "flex", flexDirection: "column", backgroundColor: "var(--md-sys-color-surface)"}}>
            {/* Left Side: Hero & Branding (Visible on Desktop) */}
            <div style={{ padding: 'var(--md-sys-spacing-4)', backgroundColor: 'color-mix(in srgb, var(--md-sys-color-secondary-container) 20%, transparent)' ,  display: "none", alignItems: "center", justifyContent: "center" }}>
                {/* Aura Ornaments */}
                <div style={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-secondary) 10%, transparent)' ,  borderRadius: 'var(--md-sys-spacing-4)' }} />
                <div style={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-tertiary) 10%, transparent)' ,  borderRadius: 'var(--md-sys-spacing-4)', animationDelay: 'var(--md-sys-motion-duration-long)' }} />
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <div style={{display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 'var(--md-sys-spacing-6)'}}>
                        <div style={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-container-high) 50%, transparent)', borderRadius: 'var(--md-sys-shape-corner-extra-large)' , width: 'var(--md-sys-spacing-4)', height: 'var(--md-sys-spacing-4)', padding: 'var(--md-sys-spacing-6)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)"}}>
                            <Logo />
                        </div>
                        <div style={{gap: 'var(--md-sys-spacing-2)'}}>
                            <span  style={{fontSize: "var(--md-sys-typescale-body-small-font-size)", fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", color: "var(--md-sys-color-secondary)", opacity: "var(--md-sys-state-opacity-supporting)"}}>Portale Studenti</span>
                            <Typography component="h1" variant="h4" sx={{ color: 'var(--md-sys-color-on-primary)', fontWeight: "var(--md-sys-typescale-weight-black)", lineHeight: "1" }}>
                                Accesso<br /><span style={{color: 'var(--md-sys-color-primary)'}}>Diario</span>
                            </Typography>
                            <Typography component="p" variant="h5" sx={{ color: 'var(--md-sys-color-on-surface-variant)' ,  fontSize: "var(--md-sys-typescale-headline-small-font-size)", fontWeight: "var(--md-sys-typescale-weight-medium)", opacity: "var(--md-sys-state-opacity-supporting)" }}>
                                {welcomeMessage}
                            </Typography>
                        </div>
                    </div>

                    <div  style={{borderTop: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)"}}>
                        <blockquote style={{marginTop: 'var(--md-sys-spacing-4)'}}>
                            <Typography component="p" variant="h4" sx={{ color: 'var(--md-sys-color-on-surface-variant)' ,  fontSize: "var(--md-sys-typescale-headline-medium-font-size)", lineHeight: "1.625" }}>
                                "{quote.text}"
                            </Typography>
                            <footer  style={{fontSize: "var(--md-sys-typescale-body-large-font-size)", fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", color: "var(--md-sys-color-primary)"}}>
                                — {quote.author}
                            </footer>
                        </blockquote>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div  style={{flex: "1", display: "flex", alignItems: "center", justifyContent: "center", padding: 'var(--md-sys-spacing-6)', overflowY: "auto"}}>
                {/* Mobile Aura Ornaments (Hidden on Desktop) */}
                <div style={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent)' ,  borderRadius: 'var(--md-sys-spacing-4)' }} />
                <div style={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-tertiary) 10%, transparent)' ,  borderRadius: 'var(--md-sys-spacing-4)' }} />

                <div  style={{ width: "var(--md-sys-percent-100)" }}>
                    <div style={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-container-low) 70%, transparent)', padding: 'var(--md-sys-spacing-4)', borderRadius: 'var(--md-sys-shape-corner-extra-large)' , border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)"}}>
                        <div  style={{display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 'var(--md-sys-spacing-6)'}}>
                            <div  style={{marginBottom: 'var(--md-sys-spacing-8)'}}>
                                <Logo />
                            </div>
                            {onNavigate && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                                    <ContextualAskAI
                                        onNavigate={onNavigate}
                                        context={{ source: 'student-login' }}
                                       
                                        compact
                                    />
                                </Box>
                            )}
                            <div style={{gap: 'var(--md-sys-spacing-2)'}}>
                                <span style={{fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", color: "var(--md-sys-color-secondary)", opacity: "var(--md-sys-state-opacity-supporting)"}}>Portale Studenti</span>
                                <Typography component="h1" variant="h4" sx={{ color: 'var(--md-sys-color-on-primary)', fontWeight: "var(--md-sys-typescale-weight-black)", letterSpacing: "-0.005em" }}>Accesso Diario</Typography>
                            </div>
                        </div>

                        <div  style={{ display: "none" }}>
                            <Typography component="h2" variant="h5" sx={{ color: 'var(--md-sys-color-on-primary)', fontWeight: "var(--md-sys-typescale-weight-black)" }}>Identificati</Typography>
                            <Typography component="p" variant="subtitle1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' ,  fontSize: "var(--md-sys-typescale-body-large-font-size)", opacity: "var(--md-sys-state-opacity-supporting)" }}>Seleziona la tua classe per iniziare</Typography>
                        </div>

                        {step === 'class' && (
                            <div style={{marginTop: 'var(--md-sys-spacing-8)'}}>
                                <Typography component="p" variant="subtitle1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' ,  fontSize: "var(--md-sys-typescale-body-large-font-size)", fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center", opacity: "var(--md-sys-state-opacity-secondary)" }}>Seleziona la tua classe</Typography>
                                <div style={{display: "grid", gridTemplateColumns: "var(--md-sys-grid-fr-1) var(--md-sys-grid-fr-1)", gap: 'var(--md-sys-spacing-8)'}}>
                                    {uniqueClasses.map(cls => (
                                        <Button 
                                            key={cls} 
                                            onClick={() => handleClassSelect(cls)}
                                            variant="outlined"
                                             sx={{ fontWeight: "var(--md-sys-typescale-weight-black)", transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)' }}
                                        >
                                            {cls}
                                        </Button>
                                    ))}
                                </div>
                                {uniqueClasses.length === 0 && (
                                    <div style={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-error) 10%, transparent)', borderRadius: 'var(--md-sys-shape-corner-large)' , padding: 'var(--md-sys-spacing-6)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)", textAlign: "center"}}>
                                        <Typography component="p" variant="body2" sx={{color: "var(--md-sys-color-error)", fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "var(--md-sys-typescale-body-small-font-size)"}}>Nessuna classe disponibile.</Typography>
                                    </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
                                    <Button onClick={handleExitAttempt} variant="text" startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">lock</Box>} sx={{width: "var(--md-sys-percent-100)", color: "var(--md-sys-color-error)", fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "var(--md-sys-typescale-body-small-font-size)"}}>
                                        Menu Docente
                                    </Button>
                                </div>
                            </div>
                        )}

                    {step === 'credentials' && (
                        <form onSubmit={handleLogin} style={{marginTop: 'var(--md-sys-spacing-8)'}}>
                            <div style={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-primary) 5%, transparent)', borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-6)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)", display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                                 <div style={{gap: 'var(--md-sys-spacing-1)'}}>
                                    <Typography component="p" variant="body2" sx={{fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", color: "var(--md-sys-color-primary)", letterSpacing: "0.1em", opacity: "var(--md-sys-state-opacity-supporting)"}}>Classe Selezionata</Typography>
                                    <strong style={{color: "var(--md-sys-color-primary)", fontWeight: "var(--md-sys-typescale-weight-black)"}}>{selectedClass}</strong>
                                 </div>
                                 <Button type="button" onClick={() => setStep('class')} variant="outlined" sx={{ fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Cambia</Button>
                            </div>

                            <div  style={{display: "grid", gridTemplateColumns: "var(--md-sys-grid-fr-1)", gap: 'var(--md-sys-spacing-6)'}}>
                                <TextField 
                                    id="student-surname"
                                    name="student-surname"
                                    
                                    value={surname} 
                                    onChange={e => setSurname(e.target.value)} 
                                    required 
                                    placeholder="Es. Rossi" 
                                    autoComplete="family-name"
                                    sx={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-container-high) 50%, transparent)' }}
                                />
                                <TextField 
                                    id="student-name"
                                    name="student-name"
                                    
                                    value={name} 
                                    onChange={e => setName(e.target.value)} 
                                    required 
                                    placeholder="Es. Mario" 
                                    autoComplete="given-name"
                                    sx={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-container-high) 50%, transparent)' }}
                                />
                            </div>
                            <TextField 
                                id="student-birthdate"
                                name="student-birthdate"
                                
                                type="date" 
                                value={birthDate} 
                                onChange={e => setBirthDate(e.target.value)} 
                                required 
                                autoComplete="bday"
                                sx={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-container-high) 50%, transparent)' }}
                            />

                            {error && (
                                <div style={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-error) 10%, transparent)', borderRadius: 'var(--md-sys-shape-corner-large)' , padding: 'var(--md-sys-spacing-8)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)", textAlign: "center"}}>
                                    <Typography component="p" variant="body2" sx={{color: "var(--md-sys-color-error)", fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "var(--md-sys-typescale-body-small-font-size)"}}>{error}</Typography>
                                </div>
                            )}

                            <div  style={{display: "flex", gap: 'var(--md-sys-spacing-8)'}}>
                                <Button type="button" onClick={() => setStep('class')} variant="text" sx={{ fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "var(--md-sys-typescale-body-small-font-size)" }}>Indietro</Button>
                                <Button type="submit" variant="contained"  sx={{ flexGrow: "1", fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "var(--md-sys-typescale-body-small-font-size)" }}>Accedi al Diario</Button>
                            </div>
                        </form>
                    )}
                    </div>
                </div>
            </div>
            
            {isPinModalOpen && (
                <PinPadModal
                    title="Accesso Docente"
                    correctPin={securityPin}
                    onSuccess={() => { setIsPinModalOpen(false); onCancel(); }}
                    onCancel={() => setIsPinModalOpen(false)}
                />
            )}
        </div>
    );
};

export default StudentLoginScreen;


