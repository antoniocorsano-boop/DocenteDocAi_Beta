// MD3 Compliant - Block N Migration Complete (7 violations eliminated)
import React, { useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { errorLogger, ErrorLog } from '../services/errorLogger';
import { M3ConfirmDialog } from './ui';
interface ErrorLogsDashboardProps {
  onClose?: () => void;
}

const ErrorLogsDashboard: React.FC<ErrorLogsDashboardProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [filterType, setFilterType] = useState<ErrorLog['type'] | 'all'>('all');
  const [filterSeverity, setFilterSeverity] = useState<ErrorLog['severity'] | 'all'>('all');
  const [stats, setStats] = useState(errorLogger.getErrorStats());
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    const allLogs = errorLogger.getAllLogs();
    setLogs(allLogs.reverse());
    setStats(errorLogger.getErrorStats());
  }, []);

  const filteredLogs = logs.filter((log) => {
    const typeMatch = filterType === 'all' || log.type === filterType;
    const severityMatch = filterSeverity === 'all' || log.severity === filterSeverity;
    return typeMatch && severityMatch;
  });

  const handleExport = () => {
    const json = errorLogger.exportLogsAsJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    setConfirmDialog({
      message: 'Sei sicuro di voler eliminare tutti i log?',
      onConfirm: () => {
        errorLogger.clearAllLogs();
        setLogs([]);
        setStats(errorLogger.getErrorStats());
      }
    });
  };

  const getSeverityColor = (severity: ErrorLog['severity']) => {
    switch (severity) {
      case 'error':
        return 'text-error bg-error/10';
      case 'warning':
        return 'text-warning bg-warning/10';
      case 'info':
        return 'text-primary bg-primary/10';
    }
  };

  const getTypeIcon = (type: ErrorLog['type']) => {
    const icons: Record<ErrorLog['type'], string> = {
      navigation: 'directions',
      ai: 'psychology',
      analytics: 'analytics',
      sync: 'sync',
      validation: 'verified_user',
      general: 'info',
    };
    return icons[type];
  };

  return (
    <div  style={{padding: 'var(--md-sys-spacing-6)', marginLeft: "var(--md-sys-margin-auto)", marginRight: "var(--md-sys-margin-auto)"}}>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 'var(--md-sys-spacing-6)'}}>
        <h1>Error Logs Dashboard</h1>
        {onClose && (
          <button onClick={onClose} style={{ color: 'var(--md-sys-color-on-surface)', cursor: "pointer" }}>
            close
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div  style={{display: "grid", gridTemplateColumns: "var(--md-sys-grid-fr-1)", gap: 'var(--md-sys-spacing-8)', marginBottom: 'var(--md-sys-spacing-6)'}}>
        <div style={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-on-primary)' , padding: 'var(--md-sys-spacing-8)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)"}}>
          <div style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Total Errors</div>
          <div  style={{fontWeight: "var(--md-sys-typescale-weight-bold)", color: "var(--md-sys-color-primary)"}}>{stats.total}</div>
        </div>
        <div style={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-on-primary)' , padding: 'var(--md-sys-spacing-8)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)"}}>
          <div style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Errors</div>
          <div  style={{fontWeight: "var(--md-sys-typescale-weight-bold)", color: "var(--md-sys-color-error)"}}>{stats.bySeverity['error'] || 0}</div>
        </div>
        <div style={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-on-primary)' , padding: 'var(--md-sys-spacing-8)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)"}}>
          <div style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Warnings</div>
          <div  style={{fontWeight: "var(--md-sys-typescale-weight-bold)", color: "var(--md-sys-color-warning)"}}>{stats.bySeverity['warning'] || 0}</div>
        </div>
        <div style={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-on-primary)' , padding: 'var(--md-sys-spacing-8)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)"}}>
          <div style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Infos</div>
          <div  style={{fontWeight: "var(--md-sys-typescale-weight-bold)", color: "var(--md-sys-color-primary)"}}>{stats.bySeverity['info'] || 0}</div>
        </div>
      </div>

      {/* Type Breakdown */}
      <div style={{marginBottom: 'var(--md-sys-spacing-6)'}}>
        <Typography component="h2" variant="h6" sx={{marginBottom: 'var(--md-sys-spacing-6)'}}>By Type</Typography>
        <div  style={{display: "grid", gridTemplateColumns: "var(--md-sys-grid-fr-1)", gap: 'var(--md-sys-spacing-6)'}}>
          {Object.entries(stats.byType).map(([type, count]) => (
            <div key={type} style={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-surface-container-low)' , padding: 'var(--md-sys-spacing-6)'}}>
              <div style={{display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)'}}>
                <span>{getTypeIcon(type as ErrorLog['type'])}</span>
                <span style={{ textTransform: "capitalize" }}>{type}</span>
              </div>
              <div style={{ fontWeight: "var(--md-sys-typescale-weight-bold)", color: "var(--md-sys-color-primary)", marginTop: 'var(--md-sys-spacing-4)'}}>{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div style={{display: "flex", gap: 'var(--md-sys-spacing-6)', marginBottom: 'var(--md-sys-spacing-6)', flexWrap: "wrap"}}>
        <div style={{display: "flex", gap: 'var(--md-sys-spacing-8)'}}>
          <label style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Tipo:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType((e.target as HTMLSelectElement).value as ErrorLog['type'] | 'all')}
             style={{borderRadius: "var(--md-sys-shape-corner-small)", border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)", backgroundColor: "var(--md-sys-color-surface)"}}
          >
            <option value="all">Tutti</option>
            <option value="navigation">Navigation</option>
            <option value="ai">AI</option>
            <option value="analytics">Analytics</option>
            <option value="sync">Sync</option>
            <option value="validation">Validation</option>
            <option value="general">General</option>
          </select>
        </div>

        <div style={{display: "flex", gap: 'var(--md-sys-spacing-8)'}}>
          <label style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Severity:</label>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity((e.target as HTMLSelectElement).value as ErrorLog['severity'] | 'all')}
             style={{borderRadius: "var(--md-sys-shape-corner-small)", border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)", backgroundColor: "var(--md-sys-color-surface)"}}
          >
            <option value="all">Tutti</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>

        <button
          onClick={handleExport}
           style={{paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)', borderRadius: "var(--md-sys-shape-corner-small)", backgroundColor: "var(--md-sys-color-primary)", color: "var(--md-sys-color-on-surface)", fontWeight: "var(--md-sys-typescale-weight-medium)", display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)'}}
        >
          <Box component="span" className="material-symbols-outlined" aria-hidden="true">download</Box>
          Export JSON
        </button>

        <button
          onClick={handleClearLogs}
          style={{ backgroundColor: 'var(--md-sys-color-error)', color: 'var(--md-sys-color-on-error)' , paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)', borderRadius: "var(--md-sys-shape-corner-small)", fontWeight: "var(--md-sys-typescale-weight-medium)", display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)'}}
        >
          <Box component="span" className="material-symbols-outlined" aria-hidden="true">delete</Box>
          Clear All
        </button>
      </div>

      {/* Logs Table */}
      <div style={{ borderRadius: 'var(--md-sys-shape-corner-large)' , border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)"}}>
        <div style={{ overflowX: "auto" }}>
          <table  style={{ width: "var(--md-sys-percent-100)" }}>
            <thead style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }}>
              <tr>
                <th  style={{textAlign: "left", padding: 'var(--md-sys-spacing-6)'}}>Time</th>
                <th  style={{textAlign: "left", padding: 'var(--md-sys-spacing-6)'}}>Type</th>
                <th  style={{textAlign: "left", padding: 'var(--md-sys-spacing-6)'}}>Severity</th>
                <th  style={{textAlign: "left", padding: 'var(--md-sys-spacing-6)'}}>Message</th>
                <th  style={{textAlign: "left", padding: 'var(--md-sys-spacing-6)'}}>Context</th>
              </tr>
            </thead>
            <tbody >
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id}  style={{ transition: "color var(--md-sys-motion-duration-medium4)" }}>
                    <td  style={{padding: 'var(--md-sys-spacing-6)', whiteSpace: "nowrap"}}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{padding: 'var(--md-sys-spacing-5)'}}>
                      <span style={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent)' , display: "inline-flex", alignItems: "center", gap: 'var(--md-sys-spacing-4)', paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)', borderRadius: "var(--md-sys-shape-corner-small)", color: "var(--md-sys-color-primary)", fontWeight: "var(--md-sys-typescale-weight-medium)"}}>
                        <span>
                          {getTypeIcon(log.type)}
                        </span>
                        {log.type}
                      </span>
                    </td>
                    <td style={{padding: 'var(--md-sys-spacing-5)'}}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 'var(--md-sys-spacing-4)',
                        padding: 'var(--md-sys-spacing-4) var(--md-sys-spacing-1)',
                        borderRadius: 'var(--md-sys-shape-corner-small)',
                        fontWeight: 'var(--md-sys-typescale-weight-medium)',
                        textTransform: 'capitalize',
                        backgroundColor: getSeverityColor(log.severity)
                      }}>
                        {log.severity}
                      </span>
                    </td>
                    <td style={{ color: 'inherit' , padding: 'var(--md-sys-spacing-6)'}}>
                      <span title={log.message}>{log.message}</span>
                    </td>
                    <td style={{padding: 'var(--md-sys-spacing-5)'}}>
                      {log.context && (
                        <details>
                          <summary  style={{cursor: "pointer", color: "var(--md-sys-color-primary)"}}>View</summary>
                          <pre style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)' , marginTop: 'var(--md-sys-spacing-4)', padding: 'var(--md-sys-spacing-8)', borderRadius: "var(--md-sys-shape-corner-small)", overflow: "auto"}}>
                            {JSON.stringify(log.context, null, 2)}
                          </pre>
                        </details>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ color: 'var(--md-sys-color-on-surface-variant)' , padding: 'var(--md-sys-spacing-6)', textAlign: "center"}}>
                    Nessun log trovato
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Most Recent Error */}
      {stats.mostRecent && (
        <div style={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'color-mix(in srgb, var(--md-sys-color-error) 10%, transparent)' , marginTop: 'var(--md-sys-spacing-6)', padding: 'var(--md-sys-spacing-8)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)"}}>
          <div  style={{color: "var(--md-sys-color-error)", marginBottom: 'var(--md-sys-spacing-8)'}}>Most Recent Error</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
              <strong>Time:</strong> {new Date(stats.mostRecent.timestamp).toLocaleString()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
              <strong>Type:</strong> {stats.mostRecent.type}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
              <strong>Message:</strong> {stats.mostRecent.message}
            </div>
            {stats.mostRecent.stack && (
              <details style={{marginTop: 'var(--md-sys-spacing-4)'}}>
                <summary  style={{cursor: "pointer", color: "var(--md-sys-color-primary)"}}>Stack Trace</summary>
                <pre style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)' , marginTop: 'var(--md-sys-spacing-4)', padding: 'var(--md-sys-spacing-8)', borderRadius: "var(--md-sys-shape-corner-small)", overflow: "auto"}}>
                  {stats.mostRecent.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )}
      {confirmDialog && (
        <M3ConfirmDialog
          title="Conferma eliminazione"
          message={confirmDialog.message}
          onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
          onCancel={() => setConfirmDialog(null)}
          danger={true}
        />
      )}
    </div>
  );
};

export default ErrorLogsDashboard;

