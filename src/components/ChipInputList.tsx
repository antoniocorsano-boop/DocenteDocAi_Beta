// MD3 Compliant - Block J Migration Complete (4 violations eliminated)

import React, { useState, useRef } from 'react';
import Typography from '@mui/material/Typography';
interface ChipInputListProps {
    items: string[];
    onAdd: (item: string) => void;
    onRemove: (index: number) => void;
    placeholder: string;
    icon: string;
    label: string;
    variant?: 'class' | 'subject' | 'default'; // New prop
}

const ChipInputList: React.FC<ChipInputListProps> = ({ items, onAdd, onRemove, placeholder, icon, label, variant = 'default' }) => {
  const [newItem, setNewItem] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleAdd = () => {
        if (newItem.trim()) {
            if (newItem.includes(',')) {
                const parts = newItem.split(',').map(s => s.trim()).filter(s => s);
                parts.forEach(p => onAdd(p));
            } else {
                onAdd(newItem.trim());
            }
            setNewItem('');
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
        if (e.key === 'Backspace' && !newItem && items.length > 0) {
            onRemove(items.length - 1);
        }
    };

    return (
        <div style={{marginBottom: 'var(--md-sys-spacing-8)'}}>
             <div  style={{display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 'var(--md-sys-spacing-8)'}}>
                <div style={{display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-6)'}}>
                    <div style={{
                        width: 'var(--md-sys-spacing-10)',
                        height: 'var(--md-sys-spacing-10)',
                        borderRadius: 'var(--md-sys-shape-corner-large)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--md-sys-elevation-level1)',
                        transition: 'transform var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)',
                        backgroundColor: variant === 'class' ? 'var(--md-sys-color-secondary-container)' :
                                       variant === 'subject' ? 'var(--md-sys-color-tertiary-container)' :
                                       'var(--md-sys-color-primary-container)',
                        color: variant === 'class' ? 'var(--md-sys-color-on-secondary-container)' :
                               variant === 'subject' ? 'var(--md-sys-color-on-tertiary-container)' :
                               'var(--md-sys-color-on-primary-container)'
                    }}>
                        <span className="material-symbols-outlined" aria-hidden="true" style={{
                            fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                            userSelect: 'none'
                        }}>{icon}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                        <label style={{ color: 'var(--md-sys-color-on-primary)', fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)", display: "block" }}>
                            {label}
                        </label>
                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: "var(--md-sys-typescale-weight-bold)", opacity: "var(--md-sys-state-opacity-placeholder)", textTransform: "uppercase" }}>
                            {items.length} {items.length === 1 ? 'elemento' : 'elementi'} salvati
                        </span>
                    </div>
                </div>
             </div>
             
             <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-large)' , padding: 'var(--md-sys-spacing-8)', border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline)'}}>
                <div  style={{marginBottom: 'var(--md-sys-spacing-8)'}}>
                    {items.map((item, index) => (
                        <div key={index} style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 'var(--md-sys-spacing-2)',
                            padding: 'var(--md-sys-spacing-2) var(--md-sys-spacing-3)',
                            backgroundColor: variant === 'class' ? 'var(--md-sys-color-secondary-container)' :
                                           variant === 'subject' ? 'var(--md-sys-color-tertiary-container)' :
                                           'var(--md-sys-color-primary-container)',
                            color: variant === 'class' ? 'var(--md-sys-color-on-secondary-container)' :
                                  variant === 'subject' ? 'var(--md-sys-color-on-tertiary-container)' :
                                  'var(--md-sys-color-on-primary-container)',
                            borderRadius: 'var(--md-sys-shape-corner-large)',
                            fontSize: 'var(--md-sys-typescale-body-small-font-size)',
                            fontWeight: 'var(--md-sys-typescale-body-small-font-weight)',
                            lineHeight: 'var(--md-sys-typescale-body-large-line-height)',
                            animation: 'zoom-in-95 var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)-out',
                            cursor: 'pointer',
                            transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)',
                            border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline-variant)'
                        }}>
                            <span>{item}</span>
                            <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onRemove(index); }} 
                                
                                aria-label={`Rimuovi ${item}`}
                                tabIndex={-1}
                                style={{
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    color: 'inherit',
                                    cursor: 'pointer',
                                    padding: 'var(--md-sys-spacing-1)',
                                    borderRadius: 'var(--md-sys-shape-corner-full)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: 'var(--md-sys-state-opacity-supporting)',
                                    transition: 'opacity var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)'
                                }}
                            >
                                <span className="material-symbols-outlined" aria-hidden="true" style={{
                                    fontSize: 'var(--md-sys-typescale-label-large-font-size)',
                                    userSelect: 'none'
                                }}>close</span>
                            </button>
                        </div>
                    ))}
                    
                    {items.length === 0 && (
                        <Typography component="p" variant="subtitle1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' , fontSize: 'var(--md-sys-typescale-body-large-font-size)', opacity: "var(--md-sys-state-opacity-empty)", paddingTop: 'var(--md-sys-spacing-4)', paddingBottom: 'var(--md-sys-spacing-4)', paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)'}}>Nessun elemento aggiunto...</Typography>
                    )}
                </div>
                
                {/* Integrated Input Area */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--md-sys-spacing-3)',
                    padding: 'var(--md-sys-spacing-3)',
                    border: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline-variant)',
                    borderRadius: 'var(--md-sys-shape-corner-large)',
                    backgroundColor: 'var(--md-sys-color-surface-container-highest)',
                    transition: 'border-color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)'
                }} onClick={() => inputRef.current?.focus()}>
                    <span className="material-symbols-outlined" style={{
                        fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                        opacity: 'var(--md-sys-state-opacity-secondary)',
                        transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)',
                        color: 'var(--md-sys-color-on-surface-variant)'
                    }} aria-hidden="true">add_circle</span>
                    <input 
                        ref={inputRef}
                        type="text" 
                        value={newItem} 
                        onChange={e => setNewItem(e.target.value)}
                        aria-label={`Aggiungi nuovo ${label.toLowerCase()}`}
                        onKeyDown={handleKeyDown}
                        style={{
                            flex: '1',
                            border: 'none',
                            outline: 'none',
                            backgroundColor: 'transparent',
                            color: 'var(--md-sys-color-on-surface)',
                            fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                            fontFamily: 'var(--md-sys-typescale-body-large-font-family)'
                        }}
                        placeholder={placeholder}
                        enterKeyHint="done"
                    />
                    <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleAdd(); }}
                        style={{
                            borderRadius: 'var(--md-sys-shape-corner-full)',
                            backgroundColor: newItem.trim() ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-variant)',
                            color: newItem.trim() ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface-variant)',
                            border: 'none',
                            width: 'var(--md-sys-spacing-8)',
                            height: 'var(--md-sys-spacing-8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: newItem.trim() ? 'pointer' : 'not-allowed',
                            transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)'
                        }}
                        disabled={!newItem.trim()}
                    >
                        <span className="material-symbols-outlined" aria-hidden="true" style={{
                            fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                            userSelect: 'none'
                        }}>arrow_forward</span>
                    </button>
                </div>
                <Typography component="p" variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', opacity: "var(--md-sys-state-opacity-empty)", marginTop: 'var(--md-sys-spacing-3)', paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)', textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)", fontWeight: "var(--md-sys-typescale-weight-bold)" }}>
                    Premi Invio o usa la virgola per aggiungere più elementi
                </Typography>
            </div>
        </div>
    );
};

export default ChipInputList;

