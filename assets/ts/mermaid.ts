// What a markdown renderer emits for a ```mermaid fence: the language's code
// block, like any other. `code-block.ts` imports this class to leave these
// blocks alone, so the two passes agree on one definition and can run in
// either order.
export const MERMAID_LANGUAGE_CLASS = 'language-mermaid';

const MERMAID_CODE_SELECTOR = `pre > code.${MERMAID_LANGUAGE_CLASS}`;

let renderedCount = 0;

export async function initMermaid(scope: HTMLElement | Document = document): Promise<void> {
    const codes = [...scope.querySelectorAll<HTMLElement>(MERMAID_CODE_SELECTOR)];

    if (!codes.length) return;

    // Loaded on demand, as Shiki is: a page without a diagram never pays for it.
    const { default: mermaid } = await import('mermaid');

    mermaid.initialize({
        startOnLoad: false,
        // Diagram sources come from documents, not from the page's author.
        securityLevel: 'strict',
    });

    for (const code of codes) {
        const pre = code.parentElement;
        if (!pre) continue;

        const id = `mermaid-${++renderedCount}`;

        try {
            const { svg, bindFunctions } = await mermaid.render(id, code.textContent || '');
            const figure = document.createElement('figure');
            figure.innerHTML = svg;
            bindFunctions?.(figure);
            pre.replaceWith(figure);
        } catch {
            // A diagram that does not parse stays readable as its source, and
            // mermaid's scratch node for it does not linger in the page.
            document.getElementById(`d${id}`)?.remove();
        }
    }
}
