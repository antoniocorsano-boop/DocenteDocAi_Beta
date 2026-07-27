// MD3 Compliant - Block G Migration (12 violations eliminated)

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';

interface EditableContentCardProps {
  title: string;
  content: string; // The content will be a single string, newlines for lists
  onSave: (newContent: string) => void;
  icon?: string;
}

const EditableContentCard: React.FC<EditableContentCardProps> = ({ title, content, onSave, icon }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentContent, setCurrentContent] = useState(content);

  useEffect(() => {
    if (!isEditing) {
      setCurrentContent(content);
    }
  }, [content, isEditing]);

  const handleSave = () => {
    onSave(currentContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCurrentContent(content); // Revert to original content
    setIsEditing(false);
  };

  const renderContent = () => {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    if (lines.length > 1 || content.startsWith('• ') || content.startsWith('- ')) {
      return (
        <ul style={{ paddingLeft: 'var(--md-sys-spacing-5)', gap: 'var(--md-sys-spacing-1)' }}>
          {lines.map((item, index) => <li key={index}>{item.replace(/^[•-]\s*/, '').trim()}</li>)}
        </ul>
      );
    }
    return <p>{content}</p>;
  }

  return (
    <Box
      sx={{
        borderRadius: 'var(--md-sys-shape-corner-extra-large)',
        padding: 'var(--md-sys-spacing-8)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Typography variant="subtitle2" sx={{ color: 'var(--md-sys-color-on-primary)', display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-8)' }}>
          {icon && <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }} aria-hidden="true">{icon}</span>}
          {title}
        </Typography>
        {!isEditing && (
          <IconButton
            onClick={() => setIsEditing(true)}
            aria-label="Modifica contenuto"
            size="small"
            sx={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-small)' }}
          >
            <Box component="span" className="material-symbols-outlined" aria-hidden="true">edit</Box>
          </IconButton>
        )}
      </Box>

      <Box sx={{ marginTop: 'var(--md-sys-spacing-4)' }}>
        {isEditing ? (
          <Stack spacing={2}>
            <TextField
              multiline
              fullWidth
              value={currentContent}
              onChange={(e) => setCurrentContent(e.target.value)}
              rows={Math.max(5, currentContent.split('\n').length)}
              label="Modifica contenuto"
              autoFocus
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--md-sys-spacing-2)' }}>
              <Button onClick={handleCancel} variant="text" aria-label="Annulla modifica">Annulla</Button>
              <Button onClick={handleSave} variant="contained" aria-label="Salva contenuto">Salva</Button>
            </Box>
          </Stack>
        ) : (
          <Box sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {renderContent()}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default EditableContentCard;

