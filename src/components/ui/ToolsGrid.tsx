// MD3 Gold Compliant
// Reusable grid for "Tools / Quick Actions" sections (Phase 4 dedup)
// Used across hubs and dashboards to reduce repeated grid + card patterns

import React from 'react';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { View } from '../../types';

export interface ToolItem {
  view: View | string;
  icon: string;
  label: string;
  caption?: string;
  bg?: string;
  color?: string;
  onClick?: () => void;
}

interface ToolsGridProps {
  items: ToolItem[];
  onNavigate?: (view: View, context?: any) => void;
  columns?: { xs?: number; sm?: number; md?: number };
}

const ToolsGrid: React.FC<ToolsGridProps> = ({
  items,
  onNavigate,
  columns = { xs: 4, sm: 3, md: 4 },
}) => {
  return (
    <Grid container spacing="var(--md-sys-spacing-3)">
      {items.map((item, index) => (
        <Grid key={index} size={{ xs: columns.xs ?? 4, sm: columns.sm ?? 3, md: columns.md ?? 4 }}>
          <Card sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', height: '100%' }}>
            <ButtonBase
              onClick={() => {
                if (item.onClick) {
                  item.onClick();
                } else if (onNavigate && typeof item.view === 'string') {
                  onNavigate(item.view as View);
                }
              }}
              aria-label={item.label}
              sx={{
                display: 'block',
                width: '100%',
                p: 'var(--md-sys-spacing-4)',
                height: '100%',
                borderRadius: 'var(--md-sys-shape-corner-large)',
              }}
            >
              <Stack direction="row" alignItems="center" spacing="var(--md-sys-spacing-3)">
                <Box
                  sx={{
                    width: 'var(--md-sys-spacing-10)',
                    height: 'var(--md-sys-spacing-10)',
                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                    bgcolor: item.bg || 'var(--md-sys-color-surface-container-high)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Box
                    component="span"
                    className="material-symbols-outlined"
                    sx={{ color: item.color || 'var(--md-sys-color-on-surface-variant)', fontSize: 'var(--icon-size-medium)' }}
                  >
                    {item.icon}
                  </Box>
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" component="h4" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
                    {item.label}
                  </Typography>
                  {item.caption && (
                    <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mt: 'var(--md-sys-spacing-0-5)', display: 'block' }}>
                      {item.caption}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </ButtonBase>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default ToolsGrid;