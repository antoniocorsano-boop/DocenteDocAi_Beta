
/**
 * Utility per la sicurezza e la sanitizzazione dei dati.
 */

/**
 * Sanitizza una stringa HTML rimuovendo tag e attributi pericolosi (XSS prevention).
 * Usa DOMParser per analizzare l'HTML in modo sicuro e rimuovere elementi attivi.
 * 
 * @param html La stringa HTML potenzialmente non sicura
 * @returns HTML pulito e sicuro
 */
export const sanitizeHTML = (html: string): string => {
    if (!html) return "";

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Lista di tag vietati (potenzialmente pericolosi o non necessari per la visualizzazione documenti)
    const forbiddenTags = [
        'script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 
        'textarea', 'style', 'link', 'meta', 'base', 'applet', 'frame', 'frameset'
    ];

    // Lista di attributi vietati (event handlers, javascript protocols)
    const forbiddenAttrsPrefix = ['on']; // onclick, onload, etc.
    const urlAttrs = ['href', 'src', 'action', 'formaction', 'data', 'background', 'cite', 'longdesc', 'usemap', 'poster'];

    // 1. Rimuovi tag vietati
    forbiddenTags.forEach(tag => {
        const elements = doc.querySelectorAll(tag);
        elements.forEach(el => el.remove());
    });

    // 2. Pulizia attributi su tutti gli elementi rimanenti
    const allElements = doc.querySelectorAll('*');
    allElements.forEach(el => {
        // Rimuovi attributi on* (event handlers)
        Array.from(el.attributes).forEach(attr => {
            if (forbiddenAttrsPrefix.some(p => attr.name.toLowerCase().startsWith(p))) {
                el.removeAttribute(attr.name);
            }
            
            // Previeni protocolli pericolosi (javascript:, data:, vbscript:) in attributi URL
            if (urlAttrs.includes(attr.name.toLowerCase())) {
                const val = attr.value.toLowerCase().trim();
                if (val.startsWith('javascript:') || val.startsWith('vbscript:') || val.startsWith('data:text/html')) {
                    el.removeAttribute(attr.name);
                }
            }
        });
    });

    return doc.body.innerHTML;
};

