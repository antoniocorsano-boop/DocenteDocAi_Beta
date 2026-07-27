// MD3 Compliant - Block O Migration Complete (7 violations eliminated)
// Note: Font sizes (rem values) retained for typography and icons per MD3 policy

import React, { useMemo, useState, useEffect } from 'react';
import { Lezione, Slot, EventoCalendario, AppActions } from '../types';
import { DAYS_OF_WEEK } from '../constants';
import { useAcademicStore } from '../stores/useAcademicStore';

import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import VoiceNoteRecorder from './VoiceNoteRecorder';
interface FlowModeProps {
    actions: AppActions;
    onOpenOperations: () => void;
    onOpenLiveAssistant: () => void;
}

interface BaseTimelineItem {
    id: string;
    type: 'lesson' | 'event' | 'gap';
    time: string; // HH:MM
    endTime?: string;
    title: string;
    subtitle?: string;
    status: 'past' | 'current' | 'future';
    actionLabel?: string;
    onAction?: () => void;
}

interface LessonTimelineItem extends BaseTimelineItem {
    type: 'lesson';
    data: { slot: Slot; lesson: Lezione | null };
}

interface EventTimelineItem extends BaseTimelineItem {
    type: 'event';
    data: EventoCalendario;
}

interface GapTimelineItem extends BaseTimelineItem {
    type: 'gap';
    data?: undefined;
}

type TimelineItem = LessonTimelineItem | EventTimelineItem | GapTimelineItem;

const FlowMode: React.FC<FlowModeProps> = ({ actions, onOpenOperations, onOpenLiveAssistant }) => {
  const slots = useAcademicStore(state => state.slots);
    const lessons = useAcademicStore(state => state.lessons);
    const eventi = useAcademicStore(state => state.eventi);
    
    const { handleStartClassroom, handleNavigate, handleAddNote } = actions;
    
    // --- TIME LOGIC ---
    const [now, setNow] = useState(new Date());
    
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const todayName = DAYS_OF_WEEK[now.getDay() - 1] || DAYS_OF_WEEK[6];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // --- TIMELINE GENERATION ---
    const timelineItems = useMemo(() => {
        const items: TimelineItem[] = [];
        
        // FIX: Use local time for comparison instead of UTC to avoid date shifting
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayDateStr = `${year}-${month}-${day}`;

        // 1. Slots (Today's Lessons)
        Object.values(slots).forEach((slot: Slot) => {
            if (slot.giorno === todayName) {
                const [h, m] = slot.ora.split(':').map(Number);
                const slotStartMinutes = h * 60 + m;
                const slotEndMinutes = slotStartMinutes + 60; // Assume 1h duration
                
                let status: TimelineItem['status'] = 'future';
                if (currentMinutes >= slotEndMinutes) status = 'past';
                else if (currentMinutes >= slotStartMinutes) status = 'current';

                const lesson = slot.lezioneId ? lessons[slot.lezioneId] : null;
                const title = lesson ? lesson.materia : (slot.materia || 'Ora buca');
                const subtitle = lesson ? lesson.contenuto : (slot.classe || 'Nessuna classe');

                items.push({
                    id: `slot-${slot.giorno}-${slot.ora}`,
                    type: 'lesson',
                    time: slot.ora,
                    endTime: `${String(h+1).padStart(2,'0')}:${String(m).padStart(2,'0')}`,
                    title,
                    subtitle,
                    status,
                    data: { slot, lesson },
                    actionLabel: status === 'current' ? 'Avvia Lezione' : (status === 'past' ? 'Vedi Registro' : 'Pianifica'),
                    onAction: () => {
                        if (lesson) {
                            handleStartClassroom(slot.classe!, slot.materia!, `${slot.giorno}-${slot.ora}`, lesson);
                        } else if (slot.classe && slot.materia) {
                            // Empty slot but assigned
                            actions.setEditingSlotKey(`${slot.giorno}-${slot.ora}`);
                        } else {
                            // Empty unassigned
                            actions.handleEditSlot(slot.giorno, slot.ora);
                        }
                    }
                } as LessonTimelineItem);
            }
        });

        // 2. Events (Today)
        eventi.filter(e => e.data === todayDateStr).forEach(evt => {
            const time = evt.oraInizio || '00:00';
            const [h, m] = time.split(':').map(Number);
            const evtMinutes = h * 60 + m;
            
            let status: TimelineItem['status'] = 'future';
            if (currentMinutes > evtMinutes + 60) status = 'past'; // Rough estimate
            else if (currentMinutes >= evtMinutes && currentMinutes <= evtMinutes + 60) status = 'current';

            items.push({
                id: evt.id,
                type: 'event',
                time,
                title: evt.titolo,
                subtitle: evt.tipo,
                status,
                data: evt,
                actionLabel: 'Dettagli',
                onAction: () => handleNavigate('calendario')
            } as EventTimelineItem);
        });

        // Sort by time
        return items.sort((a, b) => a.time.localeCompare(b.time));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slots, lessons, eventi, now, todayName, currentMinutes, handleStartClassroom, handleNavigate]);

    // Find current active item

return (
        <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', display: "flex", flexDirection: "column", height: "var(--md-sys-percent-full)" }}>
            
            {/* --- HEADER (Minimal) --- */}
            <div style={{ backgroundColor: 'var(--md-sys-color-surface-container)', display: "flex", justifyContent: "space-between", alignItems: "center", padding: 'var(--md-sys-spacing-6)', borderBottom: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)"}}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <Typography component="h1" variant="h4" sx={{ color: 'var(--md-sys-color-on-primary)', fontWeight: "var(--md-sys-typescale-weight-black)", letterSpacing: "var(--md-sys-typescale-body-medium-tracking)" }}>Flow</Typography>
                    <Typography component="p" variant="body1" sx={{color: "var(--md-sys-color-primary)", fontWeight: "var(--md-sys-typescale-weight-bold)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)", opacity: "var(--md-sys-state-opacity-supporting)"}}>{todayName}, {now.toLocaleDateString('it-IT', { day: '2-digit', month: 'long' })}</Typography>
                </div>
                <IconButton
                  aria-label="Apri centro operativo"
                  onClick={onOpenOperations}
                  sx={{
                    borderRadius: 'var(--md-sys-shape-corner-large)',
                    backgroundColor: 'var(--md-sys-color-primary-container)',
                    width: 'var(--md-sys-spacing-4)',
                    height: 'var(--md-sys-spacing-4)',
                    color: 'var(--md-sys-color-on-primary-container)',
                    border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)',
                  }}
                >
                  <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)' }}>bolt</Box>
                </IconButton>
            </div>

            {/* --- TIMELINE STREAM --- */}
            <div  style={{flexGrow: "1", overflowY: "auto", gap: 'var(--md-sys-spacing-8)'}}>
                {timelineItems.length === 0 && (
                    <div 
                        style={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-container-low) 50%, transparent)' , textAlign: "center", opacity: "var(--md-sys-state-opacity-placeholder)", border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)"}}
                    >
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-primary)', opacity: 'var(--md-sys-state-opacity-empty)', marginBottom: 'var(--md-sys-spacing-8)'}}>event_busy</Box>
                        <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' ,  fontWeight: "var(--md-sys-typescale-weight-bold)" }}>Nessun evento o lezione oggi.</Typography>
                        <Button
                          onClick={() => actions.handleNavigate('timetable')}
                          sx={{
                            mt: 'var(--md-sys-spacing-4)',
                            py: 'var(--md-sys-spacing-4)',
                            borderRadius: 'var(--md-sys-spacing-4)',
                            backgroundColor: 'color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent)',
                            color: 'var(--md-sys-color-primary)',
                          }}
                        >
                          Configura Orario
                        </Button>
                    </div>
                )}

                {timelineItems.map((item, index) => {
                    const isLast = index === timelineItems.length - 1;
                    
                    if (item.status === 'current') {
                        // HERO CARD FOR CURRENT EVENT
                        return (
                            <div key={item.id} >
                                <div style={{ backgroundColor: 'var(--md-sys-color-outline-variant)' ,  width: "var(--md-sys-spacing-1)", borderRadius: 'var(--md-sys-spacing-4)' }}></div>
                                <div  style={{width: "var(--md-sys-spacing-6)", height: "var(--md-sys-spacing-6)", borderRadius: 'var(--md-sys-spacing-4)', backgroundColor: "var(--md-sys-color-primary)"}}></div>
                                
                                <div  style={{marginBottom: 'var(--md-sys-spacing-6)', fontWeight: "var(--md-sys-typescale-weight-black)", color: "var(--md-sys-color-primary)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)'}}>
                                    <span  style={{ display: "flex", height: "var(--md-sys-spacing-2)", width: "var(--md-sys-spacing-2)" }}>
                                        <span  style={{display: "inline-flex", height: "var(--md-sys-percent-full)", width: "var(--md-sys-percent-full)", borderRadius: 'var(--md-sys-spacing-4)', backgroundColor: "var(--md-sys-color-primary)", opacity: "0.75"}}></span>
                                        <span  style={{display: "inline-flex", borderRadius: 'var(--md-sys-spacing-4)', height: "var(--md-sys-spacing-2)", width: "var(--md-sys-spacing-2)", backgroundColor: "var(--md-sys-color-primary)"}}></span>
                                    </span>
                                    ADESSO • {item.time}
                                </div>
                                <div 
                                     style={{backgroundColor: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-primary)", padding: 'var(--md-sys-spacing-6)', transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)"}}
                                >
                                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 'var(--md-sys-spacing-6)'}}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                            <Typography component="h2" variant="h5" sx={{ color: 'var(--md-sys-color-on-primary)', fontWeight: "var(--md-sys-typescale-weight-black)", letterSpacing: "var(--md-sys-typescale-body-medium-tracking)", lineHeight: "1.25" }}>{item.title}</Typography>
                                            <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-primary)', opacity: "var(--md-sys-state-opacity-caption)", fontWeight: "var(--md-sys-typescale-weight-medium)", marginTop: 'var(--md-sys-spacing-4)'}}>{item.subtitle}</Typography>
                                        </div>
                                        <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 'var(--md-sys-shape-corner-large)', display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-primary)' }}>
                                                {item.type === 'lesson' ? 'school' : 'event'}
                                            </Box>
                                        </div>
                                    </div>
                                    {item.actionLabel && (
                                        <Button
                                          onClick={item.onAction}
                                          endIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)' }}>arrow_forward</Box>}
                                          sx={{
                                            borderRadius: 'var(--md-sys-shape-corner-large)',
                                            width: 'var(--md-sys-percent-full)',
                                            py: 'var(--md-sys-spacing-4)',
                                            backgroundColor: 'white',
                                            color: 'var(--md-sys-color-primary)',
                                          }}
                                        >
                                          {item.actionLabel}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    }

                    // PAST ITEMS (Compact, Faded)
                    if (item.status === 'past') {
                        return (
                            <div key={item.id}  style={{ opacity: "var(--md-sys-state-opacity-empty)" }}>
                                <div style={{ backgroundColor: 'var(--md-sys-color-surface-variant)' }}></div>
                                <div style={{ backgroundColor: 'var(--md-sys-color-surface-variant)', width: 'var(--md-sys-spacing-4)', height: 'var(--md-sys-spacing-4)', borderRadius: 'var(--md-sys-spacing-4)' }}></div>
                                <div style={{display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-6)', paddingTop: 'var(--md-sys-spacing-4)', paddingBottom: 'var(--md-sys-spacing-4)'}}>
                                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: "var(--md-sys-typescale-weight-black)", width: 'var(--md-sys-spacing-4)', textTransform: "uppercase" }}>{item.time}</span>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                        <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-primary)', fontWeight: "var(--md-sys-typescale-weight-bold)" }}>{item.title}</Typography>
                                        <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: "var(--md-sys-typescale-weight-medium)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)" }}>{item.subtitle}</Typography>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // FUTURE ITEMS (Standard)
                    return (
                        <div key={item.id} >
                            {!isLast && <div style={{ backgroundColor: 'var(--md-sys-color-outline-variant)' }}></div>}
                            <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', width: 'var(--md-sys-spacing-4)', height: 'var(--md-sys-spacing-4)', borderRadius: 'var(--md-sys-spacing-4)' }}></div>
                            
                            <div 
                                style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', padding: 'var(--md-sys-spacing-5)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)", transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)', cursor: "pointer", borderRadius: 'var(--md-sys-shape-corner-large)' }} 
                                onClick={item.onAction}
                            >
                                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 'var(--md-sys-spacing-6)'}}>
                                    <span style={{ backgroundColor: 'var(--md-sys-color-primary-container)', fontWeight: "var(--md-sys-typescale-weight-black)", color: "var(--md-sys-color-primary)", borderRadius: 'var(--md-sys-spacing-4)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)"}}>{item.time}</span>
                                    {item.type === 'lesson' && <span style={{ color: 'var(--md-sys-color-on-surface-variant)' ,  fontWeight: "var(--md-sys-typescale-weight-black)", textTransform: "uppercase", opacity: "var(--md-sys-state-opacity-placeholder)" }}>Lezione</span>}
                                </div>
                                <Typography component="h3" variant="h6" sx={{ color: 'var(--md-sys-color-on-primary)' ,  fontWeight: "var(--md-sys-typescale-weight-black)", transition: "color var(--md-sys-motion-duration-medium)" }}>{item.title}</Typography>
                                <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' , fontWeight: "var(--md-sys-typescale-weight-medium)", marginTop: 'var(--md-sys-spacing-4)'}}>{item.subtitle}</Typography>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- MAGIC BOTTOM BAR (Floating) --- */}
            <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', padding: 'var(--md-sys-spacing-6)', display: 'flex', justifyContent: 'center' }}>
                <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', opacity: 'var(--md-sys-state-opacity-caption)', borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-4)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)", display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-6)' }}>
                    
                    <IconButton
                      aria-label="Impostazioni"
                      onClick={() => actions.handleNavigate('settings')}
                      sx={{
                        color: 'var(--md-sys-color-on-surface-variant)',
                        width: 'var(--md-sys-spacing-4)',
                        height: 'var(--md-sys-spacing-4)',
                        borderRadius: 'var(--md-sys-spacing-4)',
                      }}
                    >
                      <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)' }}>settings</Box>
                    </IconButton>

                    <ButtonBase
                      onClick={onOpenLiveAssistant}
                      aria-label="Chiedi all'assistente"
                      sx={{
                        backgroundColor: 'var(--md-sys-color-surface-container-low)',
                        opacity: 'var(--md-sys-state-opacity-placeholder)',
                        color: 'var(--md-sys-color-on-surface-variant)',
                        flexGrow: 1,
                        borderRadius: 'var(--md-sys-spacing-4)',
                        height: 'var(--md-sys-spacing-4)',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: 'var(--md-sys-typescale-label-medium-font-size)',
                        fontWeight: 'var(--md-sys-typescale-weight-bold)',
                        border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)',
                      }}
                    >
                      Chiedi all'assistente...
                    </ButtonBase>

                    <VoiceNoteRecorder onTranscription={(text) => handleAddNote({ note: text })} compact />
                    
                    <IconButton
                      aria-label="Progettazione"
                      onClick={() => actions.handleNavigate('progettazione-hub')}
                      sx={{
                        width: 'var(--md-sys-spacing-4)',
                        height: 'var(--md-sys-spacing-4)',
                        borderRadius: 'var(--md-sys-spacing-4)',
                        backgroundColor: 'var(--md-sys-color-primary)',
                        color: 'var(--md-sys-color-on-primary)',
                      }}
                    >
                      <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)' }}>add</Box>
                    </IconButton>
                </div>
            </div>

        </div>
    );
};

export default React.memo(FlowMode);

