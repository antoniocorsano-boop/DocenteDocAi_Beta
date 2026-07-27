/// <reference types="vite/client" />

declare global {
    interface Window {
        gapi?: unknown;
        google?: unknown;
        __TEST_MODE?: boolean;
        __SILENCE_ASSISTANT_LOGS?: boolean;
        // Shared runtime instrumentation object used by the app and tests
        __app_instrumentation?: AppInstrumentation;
        __sw_unregistered?: boolean;
    }
}

export {};

// Runtime instrumentation shape (kept permissive to avoid tight coupling)
interface AppInstrumentation {
    user?: { id: string; displayName?: string };
    isRestoring?: boolean;
    appShellMounted?: boolean;
    __TEST_MODE?: boolean;
    // allow additional runtime fields without breaking type checks
    [key: string]: unknown;
}

