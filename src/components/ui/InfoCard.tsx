import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import type { SxProps, Theme } from '@mui/material/styles';


interface InfoCardProps {
    title?: string;
    description?: string;
    icon?: string;
    variant?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'surface' | 'elevated' | 'tonal' | 'filled' | 'outlined' | 'contained';
    action?: React.ReactNode;
    onClose?: () => void;
    children?: React.ReactNode;
    onClick?: () => void;
    style?: React.CSSProperties;
    sx?: SxProps<Theme>;
    className?: string;
    type?: string;
    message?: string;
    filled?: boolean;
    elevation?: number;
}

const InfoCard: React.FC<InfoCardProps> = ({
    title,
    description,
    icon,
    action,
    onClose,
    children,
    onClick,
    style,
    sx,
    className,
    elevation = 1,
}) => {
    return (
        <Card
            elevation={elevation}
            onClick={onClick}
            className={className}
            sx={[
                {
                    position: 'relative',
                    cursor: onClick ? 'pointer' : 'default',
                    ...style,
                },
                ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
            ]}
        >
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Header with icon and close button */}
                {(icon || onClose) && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        {icon && (
                            <Box
                                sx={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 'var(--md-sys-shape-corner-large)',
                                    bgcolor: 'var(--md-sys-color-surface-container-high)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <span
                                    className="material-symbols-outlined"
                                    aria-hidden="true"
                                    style={{ fontSize: 24, color: 'var(--md-sys-color-on-surface-variant)' }}
                                >
                                    {icon}
                                </span>
                            </Box>
                        )}
                        {onClose && (
                            <IconButton
                                size="small"
                                onClick={(e) => { e.stopPropagation(); onClose(); }}
                                aria-label="Chiudi"
                            >
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 18 }}>close</Box>
                            </IconButton>
                        )}
                    </Box>
                )}

                {/* Content */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {title && (
                        <Typography variant="h6">{title}</Typography>
                    )}
                    {description && (
                        <Typography variant="body1">{description}</Typography>
                    )}
                    {children}
                </Box>

                {/* Action */}
                {action && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        {action}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default InfoCard;

