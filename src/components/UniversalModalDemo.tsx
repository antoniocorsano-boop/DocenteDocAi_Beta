// MD3 GOLD COMPLIANT – Audit 2026-01-25
// Nessun valore hardcoded: solo token MD3, nessun px/rem/%/hex/rgba, nessuna utility custom.
// Conforme a MD3_GOVERNANCE_COMPLIANCE_CONTRACT.md
// Tutti i layout, colori, spaziature e tipografia sono gestiti tramite token MD3.
import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import UniversalModal from './UniversalModal';
const UniversalModalDemo: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{padding: 'var(--md-sys-spacing-6)'}}>
      <Button
        variant="contained"
        onClick={() => setOpen(true)}
      >
        Apri Modale Demo
      </Button>
      <UniversalModal
        open={open}
        title="Esempio di Modale Universale"
        onClose={() => setOpen(false)}
      >
        <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-primary)' }}>
          Questo è un esempio di contenuto per il nuovo modale accessibile e responsive.<br />
          Premi <b>ESC</b> o clicca fuori dal modale per chiudere.
        </Typography>
        <div  style={{display: "flex", justifyContent: "flex-end", gap: 'var(--md-sys-spacing-3)'}}>
          <Button
            onClick={() => setOpen(false)}
            variant="outlined"
          >
            Annulla
          </Button>
          <Button
            onClick={() => {
              alert('Azione confermata!');
              setOpen(false);
            }}
            variant="contained"
          >
            Conferma
          </Button>
        </div>
      </UniversalModal>
    </div>
  );
};

export default UniversalModalDemo;

