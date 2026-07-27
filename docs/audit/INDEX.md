# DocenteDoc AI — Dossier di Audit Integrato PA & CE

**Versione dossier**: 1.0  
**Data emissione**: 18 marzo 2026  
**Commit di riferimento**: `14aeb093` (Sprint 10–15)  
**Classificazione**: RISERVATO — solo per uso interno e audit ufficiali

---

## Indice generale

| Documento                                                                    | Oggetto                                           | Stato      |
| ---------------------------------------------------------------------------- | ------------------------------------------------- | ---------- |
| [PA_AUDIT_DOSSIER_2026.md](./PA_AUDIT_DOSSIER_2026.md)                       | Dossier PA italiano (AgID · GDPR-IT · CAC · MIUR) | Bozza v1.0 |
| [CE_AUDIT_DOSSIER_2026.md](./CE_AUDIT_DOSSIER_2026.md)                       | Dossier CE europeo (AI Act · GDPR-EU · ISO)       | Bozza v1.0 |
| [docs/USE_CASES_OPERATIVI_2026.md](../USE_CASES_OPERATIVI_2026.md)           | 13 casi d'uso operativi reali                     | Definitivo |
| [docs/AUDIT_LEVEL6_2026-03-15.md](../AUDIT_LEVEL6_2026-03-15.md)             | Audit maturità Livello 6 (75% — Conditional Pass) | Definitivo |
| [docs/ARCHITECTURE_AUDIT_2026-03-16.md](../ARCHITECTURE_AUDIT_2026-03-16.md) | Report architettura tecnica                       | Definitivo |

---

## Cruscotto esecutivo — 18 marzo 2026

### Track PA (Pubblica Amministrazione italiana)

| Dimensione            | Stato                       | Note bloccanti                                                              |
| --------------------- | --------------------------- | --------------------------------------------------------------------------- |
| GDPR UE 2016/679      | ⚠️ PARZIALE                 | DPA assente (Art. 28 — **CRITICO**), DPO da nominare, RoPA mancante         |
| D.Lgs. 196/2003       | ⚠️ PARZIALE                 | Da allineare a DPA e RoPA                                                   |
| AgID interoperabilità | ⚠️ PARZIALE                 | Dichiarazione accessibilità assente, pentest mancante                       |
| D.Lgs. 82/2005 (CAC)  | ⚠️ PARZIALE                 | PEC e firma digitale non integrate                                          |
| DPCM 3 dic. 2013      | ⛔ APERTO                   | Piano conservazione documentale da predisporre                              |
| MIUR linee guida      | ✅ SOSTANZIALMENTE CONFORME | Registro elettronico, privacy minori parziale                               |
| Sicurezza applicativa | ⚠️ PARZIALE                 | 2 dangerouslySetInnerHTML non sanitizzati (`HelpModal`, `SmartImportModal`) |

**Verdetto PA**: ⚠️ NON PRONTO PER DEPLOY PA — dipende dalla risoluzione di 7 gap bloccanti (DPA, DPO, RoPA, DPIA formale, dichiarazione accessibilità, piano conservazione, pentest).

---

### Track CE (Commissione Europea / AI Act)

| Dimensione                              | Stato                       | Note bloccanti                                           |
| --------------------------------------- | --------------------------- | -------------------------------------------------------- |
| AI Act — Classificazione                | ⚠️ ALTO RISCHIO             | Annex III punto 3(b) — istruzione e valutazione studenti |
| AI Act Art. 9 — Risk Management         | ✅ CONFORME                 | Self-Compliance Engine attivo                            |
| AI Act Art. 10 — Data Governance        | ✅ CONFORME                 | Storage locale, no PII in LLM, retention 365gg           |
| AI Act Art. 11 — Documentazione tecnica | ⚠️ PARZIALE                 | In generazione automatica, non depositata                |
| AI Act Art. 12 — Logging                | ✅ CONFORME                 | complianceDb rolling log 1000 attività                   |
| AI Act Art. 13 — Trasparenza            | ✅ CONFORME                 | ExplainabilityPanel attivo                               |
| AI Act Art. 14 — Supervisione umana     | ✅ CONFORME                 | ApprovalQueueStore, HITL 4 livelli                       |
| AI Act Art. 15 — Accuratezza/Robustezza | ✅ CONFORME                 | scoreBreakdown, confidenceScore, API key server-side     |
| AI Act Art. 26 — Obblighi deployer PA   | ⛔ APERTO                   | Procedure PA non formalizzate                            |
| AI Act Art. 49 — Registrazione DB EU    | ⛔ APERTO                   | Database EU disponibile da agosto 2026                   |
| AI Act Art. 62 — Notifica incidenti     | ⛔ APERTO                   | Procedura automatica non implementata                    |
| GDPR Art. 25 — Privacy by Design        | ✅ CONFORME                 | Storage locale, minimizzazione, retention                |
| GDPR Art. 28 — DPA provider AI          | ⛔ CRITICO                  | DPA con Google e Anthropic assente                       |
| ISO/IEC 27001                           | ⚠️ PARZIALE                 | Non certificato, controlli Annex A parzialmente presenti |
| ISO/IEC 42001 (AI Governance)           | ✅ SOSTANZIALMENTE CONFORME | Risk assessment + monitoring attivi                      |

**Verdetto CE**: ⚠️ CONDIZIONATO — 7/10 obblighi AI Act implementati (70%). Sistema certificabile dopo risoluzione 3 obblighi mancanti e DPA.

---

## Sintesi gap prioritari (entrambi i track)

| #   | Gap                                                    | Standard             | Priorità   | Blocker per deploy PA               |
| --- | ------------------------------------------------------ | -------------------- | ---------- | ----------------------------------- |
| G1  | DPA con Google (Gemini) e Anthropic                    | GDPR Art. 28         | 🔴 CRITICO | SÌ                                  |
| G2  | DPO nominato e comunicato al Garante                   | GDPR Art. 37         | 🔴 ALTA    | SÌ                                  |
| G3  | Registro attività trattamento (RoPA)                   | GDPR Art. 30         | 🔴 ALTA    | SÌ                                  |
| G4  | DPIA approvata da DPO                                  | GDPR Art. 35         | 🔴 ALTA    | SÌ                                  |
| G5  | Informativa studenti minorenni/famiglie                | GDPR Art. 8, Art. 13 | 🔴 ALTA    | SÌ                                  |
| G6  | Dichiarazione accessibilità AgID (WCAG 2.1 AA)         | AgID / Legge Stanca  | 🔴 ALTA    | SÌ                                  |
| G7  | Piano formazione PA (Art. 26(6) AI Act)                | AI Act Art. 26       | 🔴 ALTA    | SÌ                                  |
| G8  | Sanitizzazione HTML in `HelpModal`, `SmartImportModal` | OWASP XSS            | 🟠 MEDIA   | NO (security debt)                  |
| G9  | Notifica incidenti al Garante (72h)                    | GDPR Art. 33         | 🟠 MEDIA   | NO (procedura manuale tollerata)    |
| G10 | Piano conservazione documentale DPCM 2013              | DPCM 3 dic. 2013     | 🟠 MEDIA   | NO (non PA-critico in fase pilota)  |
| G11 | Registrazione DB EU AI Act                             | AI Act Art. 49       | 🟡 BASSA   | NO (database EU attivo da ago 2026) |
| G12 | Hosting Edge Function in EU (Vercel EU)                | GDPR Art. 44         | 🟠 MEDIA   | DIPENDE (policy PA)                 |
| G13 | Procedura notifica incidenti AI Act Art. 62            | AI Act Art. 62       | 🟡 BASSA   | NO (post-deploy)                    |

---

## Score aggregato per track

```
Track PA:   4 / 7 framework CONFORMI o PARZIALI → 57% → NON PRONTO (soglia 80%)
Track CE:   7 / 10 obblighi AI Act implementati  → 70% → CONDIZIONATO (soglia 90%)

Gap analysis globale: 8 CONFORMI · 7 PARZIALI · 8 MANCANTI su 23 requisiti
Compliance rate effettivo: 50% (target per deploy PA: 85%)
```

---

## Stato test e qualità del codice

| Metrica                               | Valore                | Fonte                 |
| ------------------------------------- | --------------------- | --------------------- |
| Test case totali                      | 1752                  | `npm run test:unit`   |
| Test passati                          | 1740                  | Audit Level 6         |
| Test saltati (intenzionali)           | 12                    | Audit Level 6         |
| Test falliti                          | 0                     | Audit Level 6         |
| Coverage AI layer                     | 22 file / 492 test AI | Audit Level 6         |
| dangerouslySetInnerHTML sanitizzati   | 4/6                   | `SECURITY.md`         |
| TypeScript errors (`tsc -b --noEmit`) | 0                     | Verificato 2026-03-18 |

---

## Telemetria Use Case (nuovo — 2026-03-18)

Il layer `src/cognition/useCaseTelemetry.ts` traccia in tempo reale:

- Quale Use Case (UC-P1 … UC-R5) è attivo
- Outcome (completed / compliance_fail / approved / rejected / evidence_created)
- Delta compliance per evento
- Hotspot UC con più compliance_fail

Il hook `src/hooks/useUseCaseTelemetry.ts` espone questi dati a `IntelligentDashboard` e `AuditPAPanel`.

---

## Prossimi passi (roadmap audit)

### Entro deploy pilota (stima 30 giorni)

1. [ ] Stipulare DPA con Google Cloud (Gemini) e Anthropic — legale
2. [ ] Nominare DPO e compilare RoPA — PA committente
3. [ ] Far approvare DPIA da DPO — `dpiaGenerator.ts` già produce il draft
4. [ ] Aggiungere informativa studenti minorenni — frontend
5. [ ] Audit WCAG 2.1 AA + dichiarazione AccessibilitàAgID — QA
6. [ ] Piano formazione docenti/deployer PA — contenuto
7. [ ] Sanitizzare `HelpModal` e `SmartImportModal` — sviluppo

### Entro go-live completo (stima 3–6 mesi)

8. [ ] Registrazione AI Act DB EU (agosto 2026)
9. [ ] Migrazione Edge Function a hosting EU-compliant
10. [ ] Piano conservazione DPCM 2013 con conservatore accreditato AgID
11. [ ] Certificazione ISO/IEC 27001 (opzionale ma raccomandata per PA)
12. [ ] Procedura automatica notifica incidenti Garante + AgID

---

_Dossier generato da analisi diretta del codebase DocenteDoc AI — commit `14aeb093`._  
_Autori: Senior Product Analyst + AI Compliance Expert. Revisione: DPO da nominare._
