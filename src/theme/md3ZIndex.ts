export const md3ZIndex = {
  base: 0,
  appBar: 100,
  navigationDrawer: 200,
  fab: 300,
  overlayScrim: 400,
  modal: 500,
  dialog: 600,
  snackbar: 700,
  tooltip: 800,
} as const;

export type Md3ZIndexKey = keyof typeof md3ZIndex;