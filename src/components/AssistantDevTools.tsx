// MD3 Compliant
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { SystemSuggestion } from '../types';

// M3Expressive: Refactored to use dedicated CSS classes with M3 tokens for assistant development tools interface
interface AssistantDevToolsActions {
  setActiveSuggestion: (suggestion: SystemSuggestion | null) => void;
}

interface Props {
  actions: AssistantDevToolsActions;
}

const sampleSuggestion: SystemSuggestion = {
  id: 'dev-suggestion-1',
  message: "Prova: organizza una verifica di fine modulo per la classe.",
  action: { type: 'navigate', payload: { view: 'improvement-guide' } },
  actionLabel: 'Apri guida'
};

const AssistantDevTools: React.FC<Props> = ({ actions }) => {
  const [suggestionOn, setSuggestionOn] = useState(false);
  const [listening, setListening] = useState(false);

  const toggleSuggestion = () => {
    if (!suggestionOn) {
      actions.setActiveSuggestion(sampleSuggestion);
    } else {
      actions.setActiveSuggestion(null);
    }
    setSuggestionOn(!suggestionOn);
  };

  const toggleListening = () => {
    setListening(!listening);
    window.dispatchEvent(new CustomEvent('assistant:recording', { detail: { recording: !listening } }));
  };

  return (
    <Box aria-hidden={false}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Button variant="outlined" onClick={toggleSuggestion}>
          {suggestionOn ? 'Rimuovi suggerimento' : 'Simula suggerimento'}
        </Button>
        <Button variant={listening ? 'contained' : 'outlined'} onClick={toggleListening}>
          {listening ? 'Stop Listen (dev)' : 'Start Listen (dev)'}
        </Button>
      </Stack>
    </Box>
  );
};

export default AssistantDevTools;

