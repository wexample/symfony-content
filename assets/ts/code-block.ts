export async function initCodeBlocks(scope: HTMLElement | Document = document): Promise<void> {
    const classicEls = [...scope.querySelectorAll<HTMLElement>('.code-block[data-lang]')];

    // Markdown-generated <pre><code class="language-*"> not already inside .code-block
    const markdownPres = [...scope.querySelectorAll<HTMLElement>('pre:not(.code-block) > code[class*="language-"]')]
        .map(code => code.closest('pre') as HTMLElement);

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
        el.innerHTML = highlighter.codeToHtml(codeEl.textContent || '', { lang, theme: 'github-dark' });
    }

    for (const pre of markdownPres) {
        const codeEl = pre.querySelector('code');
        if (!codeEl) continue;
        const match = codeEl.className.match(/language-(\w+)/);
        const lang = match ? match[1] : 'text';
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block';
        wrapper.innerHTML = highlighter.codeToHtml(codeEl.textContent || '', { lang, theme: 'github-dark' });
        pre.replaceWith(wrapper);
    }
}
