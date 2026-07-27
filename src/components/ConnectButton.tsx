/**
 * ConnectButton — Il "Pulsante Magico"
 *
 * Context-aware button that:
 * - Shows "Collega" flow when the integration is disconnected
 * - Shows action menu when already connected
 * - Uses action-oriented language (no technical jargon)
 * - MD3 compliant — no inline styles, all tokens
 */

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { IntegrationId, ConnectionStatus } from '../types/integration.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConnectAction {
    label: string;
    icon: string;
    onClick: () => void;
    /** Shown only when integration is connected */
    requiresConnection?: boolean;
}

export interface ConnectButtonProps {
    integrationId: IntegrationId;
    /** Integration icon (Material Symbol name) */
    icon: string;
    /** Current connection state */
    status: ConnectionStatus;
    /** Called when the user taps "Connetti" on a disconnected integration */
    onConnect: () => void;
    /** Called when the user taps "Disconnetti" in the menu */
    onDisconnect?: () => void;
    /** Actions shown in the menu once connected */
    connectedActions?: ConnectAction[];
    /** Override the primary label (defaults to auto-generated) */
    label?: string;
    /** Last connected timestamp (ISO) */
    connectedAt?: string;
    /** Error message to show */
    errorMessage?: string;
    /** Show as a compact icon-only chip */
    variant?: 'full' | 'chip';
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_COLOR: Record<ConnectionStatus, string> = {
    disconnected: 'var(--md-sys-color-outline)',
    connecting: 'var(--md-sys-color-secondary)',
    connected: 'var(--md-sys-color-primary)',
    error: 'var(--md-sys-color-error)',
};

const STATUS_BG: Record<ConnectionStatus, string> = {
    disconnected: 'var(--md-sys-color-surface-container)',
    connecting: 'var(--md-sys-color-secondary-container)',
    connected: 'var(--md-sys-color-primary-container)',
    error: 'var(--md-sys-color-error-container)',
};

const STATUS_ON_BG: Record<ConnectionStatus, string> = {
    disconnected: 'var(--md-sys-color-on-surface-variant)',
    connecting: 'var(--md-sys-color-on-secondary-container)',
    connected: 'var(--md-sys-color-on-primary-container)',
    error: 'var(--md-sys-color-on-error-container)',
};

function statusLabel(status: ConnectionStatus): string {
    switch (status) {
        case 'connected': return 'Connesso';
        case 'connecting': return 'In connessione...';
        case 'error': return 'Errore';
        default: return 'Non connesso';
    }
}

// ─── Component ────────────────────────────────────────────────────────────────

const ConnectButton: React.FC<ConnectButtonProps> = ({
    integrationId,
    icon,
    status,
    onConnect,
    onDisconnect,
    connectedActions = [],
    label,
    connectedAt,
    errorMessage,
    variant = 'full',
}) => {
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

    const isConnected = status === 'connected';
    const isConnecting = status === 'connecting';
    const hasMenu = isConnected && (connectedActions.length > 0 || onDisconnect);

    const handleMainClick = (e: React.MouseEvent<HTMLElement>) => {
        if (isConnected && hasMenu) {
            setMenuAnchor(e.currentTarget);
        } else if (!isConnecting) {
            onConnect();
        }
    };

    const handleMenuClose = () => setMenuAnchor(null);

    const primaryLabel = label ?? (isConnected ? 'Usa i tuoi dati' : 'Collega');

    // ── Chip variant (compact, inline) ────────────────────────────────────────
    if (variant === 'chip') {
        return (
            <>
                <Tooltip title={isConnected ? `${statusLabel(status)} — clicca per azioni` : 'Clicca per collegare'}>
                    <Chip
                        icon={
                            isConnecting ? (
                                <CircularProgress size={14} aria-hidden="true" />
                            ) : (
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-icon-size-sm)' }}>
                                    {isConnected ? 'check_circle' : icon}
                                </Box>
                            )
                        }
                        label={statusLabel(status)}
                        onClick={handleMainClick}
                        aria-label={`${integrationId}: ${statusLabel(status)}`}
                        sx={{
                            bgcolor: STATUS_BG[status],
                            color: STATUS_ON_BG[status],
                            borderColor: STATUS_COLOR[status],
                            border: '1px solid',
                            cursor: isConnecting ? 'default' : 'pointer',
                            '& .MuiChip-icon': { color: STATUS_ON_BG[status] },
                        }}
                    />
                </Tooltip>
                {hasMenu && (
                    <ConnectMenu
                        anchor={menuAnchor}
                        onClose={handleMenuClose}
                        actions={connectedActions}
                        onDisconnect={onDisconnect}
                    />
                )}
            </>
        );
    }

    // ── Full variant (card-style row) ─────────────────────────────────────────
    return (
        <>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    p: 2,
                    bgcolor: STATUS_BG[status],
                    borderRadius: 'var(--md-sys-shape-corner-large)',
                    border: '1px solid',
                    borderColor: STATUS_COLOR[status],
                    transition: 'background-color 0.2s',
                }}
            >
                {/* Left: icon + labels */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                    <Box
                        aria-hidden="true"
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 'var(--md-sys-shape-corner-large)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: STATUS_COLOR[status],
                            color: 'var(--md-sys-color-surface)',
                            flexShrink: 0,
                        }}
                    >
                        {isConnecting ? (
                            <CircularProgress size={18} sx={{ color: 'var(--md-sys-color-surface)' }} />
                        ) : (
                            <Box component="span" className="material-symbols-outlined" sx={{ fontSize: 'var(--md-sys-icon-size-md)' }}>
                                {icon}
                            </Box>
                        )}
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            variant="overline"
                            component="span"
                            sx={{
                                display: 'block',
                                color: STATUS_ON_BG[status],
                                fontWeight: 'var(--md-sys-typescale-weight-bold)',
                            }}
                        >
                            {statusLabel(status)}
                        </Typography>
                        {isConnected && connectedAt && (
                            <Typography
                                variant="caption"
                                component="span"
                                sx={{ display: 'block', color: 'var(--md-sys-color-on-surface-variant)' }}
                            >
                                Dal {new Date(connectedAt).toLocaleDateString('it')}
                            </Typography>
                        )}
                        {status === 'error' && errorMessage && (
                            <Typography
                                variant="caption"
                                component="span"
                                sx={{ display: 'block', color: 'var(--md-sys-color-error)' }}
                            >
                                {errorMessage}
                            </Typography>
                        )}
                    </Box>
                </Box>

                {/* Right: action button */}
                {isConnected ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {connectedActions.slice(0, 1).map((a) => (
                            <Button
                                key={a.label}
                                size="small"
                                variant="contained"
                                onClick={(e) => { e.stopPropagation(); a.onClick(); }}
                                aria-label={a.label}
                                startIcon={
                                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-icon-size-sm)' }}>
                                        {a.icon}
                                    </Box>
                                }
                            >
                                {a.label}
                            </Button>
                        ))}
                        {(connectedActions.length > 1 || onDisconnect) && (
                            <IconButton
                                size="small"
                                onClick={handleMainClick}
                                aria-label="Altre azioni"
                                aria-haspopup="menu"
                            >
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-icon-size-sm)' }}>
                                    more_vert
                                </Box>
                            </IconButton>
                        )}
                    </Box>
                ) : (
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleMainClick}
                        disabled={isConnecting}
                        aria-label={primaryLabel}
                    >
                        {primaryLabel}
                    </Button>
                )}
            </Box>

            {hasMenu && (
                <ConnectMenu
                    anchor={menuAnchor}
                    onClose={handleMenuClose}
                    actions={connectedActions}
                    onDisconnect={onDisconnect}
                />
            )}
        </>
    );
};

// ─── Sub: connected actions menu ──────────────────────────────────────────────

interface ConnectMenuProps {
    anchor: HTMLElement | null;
    onClose: () => void;
    actions: ConnectAction[];
    onDisconnect?: () => void;
}

const ConnectMenu: React.FC<ConnectMenuProps> = ({ anchor, onClose, actions, onDisconnect }) => (
    <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { borderRadius: 'var(--md-sys-shape-corner-large)', minWidth: 200 } } }}
    >
        {actions.map((a) => (
            <MenuItem
                key={a.label}
                onClick={() => { a.onClick(); onClose(); }}
            >
                <ListItemIcon>
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-icon-size-md)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {a.icon}
                    </Box>
                </ListItemIcon>
                <ListItemText>{a.label}</ListItemText>
            </MenuItem>
        ))}
        {onDisconnect && [
            <MenuItem
                key="disconnect"
                onClick={() => { onDisconnect(); onClose(); }}
                sx={{ color: 'var(--md-sys-color-error)' }}
            >
                <ListItemIcon>
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-icon-size-md)', color: 'var(--md-sys-color-error)' }}>
                        link_off
                    </Box>
                </ListItemIcon>
                <ListItemText>Disconnetti</ListItemText>
            </MenuItem>,
        ]}
    </Menu>
);

export default ConnectButton;
