import type { ShikiTransformer } from 'shiki';

const codeBlockTransformer: ShikiTransformer = {
    pre(node) {
        this.addClassToHast(node, 'code-block');
    },
};

export async function initCodeBlocks(scope: HTMLElement | Document = document): Promise<void> {
    const classicEls = [...scope.querySelectorAll<HTMLElement>('.code-block[data-lang]')];
    const markdownPres = [...scope.querySelectorAll<HTMLElement>('pre:has(> code[class*="language-"])')];

    if (!classicEls.length && !markdownPres.length) return;

    const { createHighlighter } = await import('shiki');

    const classicLangs = classicEls.map(el => el.dataset.lang || 'text');
    const markdownLangs = markdownPres.map(pre => {
        const match = pre.querySelector('code')?.className.match(/language-(\w+)/);
        return match ? match[1] : 'text';
    });
    const langs = [...new Set([...classicLangs, ...markdownLangs])];

    const highlighter = await createHighlighter({
        themes: ['github-dark'],
        langs: langs as Parameters<typeof createHighlighter>[0]['langs'],
    });

    for (const el of classicEls) {
        const lang = el.dataset.lang || 'text';
        const codeEl = el.querySelector('code');
        if (!codeEl) continue;
        el.outerHTML = highlighter.codeToHtml(codeEl.textContent || '', {
            lang,
            theme: 'github-dark',
            transformers: [codeBlockTransformer],
        });
    }

    for (const pre of markdownPres) {
        const codeEl = pre.querySelector('code');
        if (!codeEl) continue;
        const match = codeEl.className.match(/language-(\w+)/);
        const lang = match ? match[1] : 'text';
        pre.outerHTML = highlighter.codeToHtml(codeEl.textContent || '', {
            lang,
            theme: 'github-dark',
            transformers: [codeBlockTransformer],
        });
    }
}
