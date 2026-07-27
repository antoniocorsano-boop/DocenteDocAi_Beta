# Neural Knowledge Aura (NKA) Module

Modulo React modulare per DocenteDoc AI, conforme a Material 3 Expressive.

## File principali
- `NKAProvider.tsx`: Context provider per stato e tema NKA
- `useNKAStore.ts`: Store Zustand per stato, nodi, impostazioni
- `types.ts`: Tipi TypeScript condivisi (nodo, settings)
- `NKAHeaderAuraButton.tsx`: Pulsante aura header (M3 + glow)
- `NKABottomSheet.tsx`: Bottom sheet con mappa neurale
- `NKANodeCard.tsx`: Card nodo neurale (M3 shape override)
- `NKASettingsToggle.tsx`: Switch impostazioni NKA
- `nka.css`: Stili custom M3-compliant
- `index.ts`: Barrel export

## Integrazione
1. Importa `NKAProvider` nel root dell’app o dove serve il contesto NKA.
2. Usa `NKAHeaderAuraButton` nell’header, mostra se `useNKAStore().enabled` è true.
3. Collega `NKABottomSheet` e gestisci apertura/chiusura.
4. Personalizza nodi tramite lo store e i tipi.

## Note
- Tutti i dati sono persistiti localmente (privacy-first)
- Componente disattivabile/attivabile da settings
- Conforme a M3, accessibilità e modularità
