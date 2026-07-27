/**
 * AISoakMetricsPanel.tsx
 * 
 * Soak monitoring panel for Post-Fase 4 central AI path.
 * Shows real-time usage of buildPrompt + generateWithCentralPrompt.
 * 
 * Place this in any dev / admin view or the existing AI devtools section.
 * 
 * Usage:
 *   <AISoakMetricsPanel />
 */

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import { AIBrain } from '../brain/AIBrain';

interface UsageStats {
  totalCentralCalls: number;
  buildPrompt: number;
  generateWithCentralPrompt: number;
  fallbackUsed: number;
  lastUsed: string | null;
  taskBreakdown: Record<string, number>;
}

const AISoakMetricsPanel: React.FC = () => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const refresh = () => {
    try {
      const raw = AIBrain.getUsageStats?.() || AIBrain.getStats?.();
      
      const normalized: UsageStats = {
        totalCentralCalls: raw?.totalCentralCalls ?? raw?.centralCalls ?? 0,
        buildPrompt: raw?.buildPrompt ?? raw?.buildPromptCalls ?? 0,
        generateWithCentralPrompt: raw?.generateWithCentralPrompt ?? raw?.generateCentralCalls ?? 0,
        fallbackUsed: raw?.fallbackUsed ?? raw?.fallbackCount ?? 0,
        lastUsed: raw?.lastUsed ?? raw?.lastCentralUse ?? null,
        taskBreakdown: raw?.taskBreakdown ?? {},
      };

      setStats(normalized);
      setLastRefreshed(new Date().toLocaleTimeString('it-IT'));
    } catch (e) {
      console.warn('[AISoakMetricsPanel] Could not read AIBrain metrics', e);
    }
  };

  useEffect(() => {
    refresh();
    // Auto-refresh every 30 seconds while panel is mounted
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, []);

  const fallbackRate = stats && stats.totalCentralCalls > 0 
    ? ((stats.fallbackUsed / stats.totalCentralCalls) * 100).toFixed(1) 
    : '0.0';

  const topTasks = stats 
    ? Object.entries(stats.taskBreakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
    : [];

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 2.5, 
        borderRadius: 3,
        border: '1px solid var(--md-sys-color-outline-variant)',
        bgcolor: 'var(--md-sys-color-surface-container-low)'
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <TrendingUpIcon fontSize="small" color="primary" />
          <Typography variant="titleSmall" sx={{ fontWeight: 600 }}>
            Post-Fase 4 Soak Metrics
          </Typography>
          <Chip 
            size="small" 
            label="SOAK ACTIVE" 
            color="success" 
            variant="outlined" 
            sx={{ fontSize: '10px', height: 20 }} 
          />
        </Stack>

        <Button 
          size="small" 
          startIcon={<RefreshIcon fontSize="small" />} 
          onClick={refresh}
          variant="text"
        >
          Refresh
        </Button>
      </Stack>

      {!stats ? (
        <Typography variant="body2" color="text.secondary">
          Loading metrics...
        </Typography>
      ) : (
        <>
          <Stack direction="row" spacing={3} sx={{ mb: 2.5, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="labelSmall" color="text.secondary">Total Central Calls</Typography>
              <Typography variant="headlineSmall" sx={{ fontWeight: 700, lineHeight: 1 }}>
                {stats.totalCentralCalls}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="labelSmall" color="text.secondary">buildPrompt</Typography>
              <Typography variant="headlineSmall" sx={{ fontWeight: 700, lineHeight: 1 }}>
                {stats.buildPrompt}
              </Typography>
            </Box>

            <Box>
              <Typography variant="labelSmall" color="text.secondary">generateWithCentralPrompt</Typography>
              <Typography variant="headlineSmall" sx={{ fontWeight: 700, lineHeight: 1 }}>
                {stats.generateWithCentralPrompt}
              </Typography>
            </Box>

            <Box>
              <Typography variant="labelSmall" color="text.secondary">Fallback Rate</Typography>
              <Typography 
                variant="headlineSmall" 
                sx={{ 
                  fontWeight: 700, 
                  lineHeight: 1,
                  color: parseFloat(fallbackRate) > 8 ? 'error.main' : 'success.main'
                }}
              >
                {fallbackRate}%
              </Typography>
            </Box>
          </Stack>

          {stats.lastUsed && (
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
              Last central call: {new Date(stats.lastUsed).toLocaleString('it-IT')}
            </Typography>
          )}

          {topTasks.length > 0 && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="labelSmall" sx={{ mb: 1, display: 'block', color: 'text.secondary' }}>
                Top Tasks (soak period)
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.75}>
                {topTasks.map(([task, count]) => (
                  <Chip 
                    key={task} 
                    label={`${task}: ${count}`} 
                    size="small" 
                    variant="outlined" 
                    sx={{ fontSize: '11px' }}
                  />
                ))}
              </Stack>
            </>
          )}

          {lastRefreshed && (
            <Typography variant="caption" color="text.disabled" sx={{ mt: 2, display: 'block', fontSize: '10px' }}>
              Last refreshed: {lastRefreshed} (auto every 30s)
            </Typography>
          )}
        </>
      )}
    </Paper>
  );
};

export default AISoakMetricsPanel;
