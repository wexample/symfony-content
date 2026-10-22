## Architecture

The package is a Symfony bundle with four PHP files and two TypeScript modules. It owns no entity, no controller, no template and — since markdown moved to `wexample/symfony-template` — no Twig extension: what it carries is two browser-side passes over code blocks. Everything else is registration plumbing.

### The pieces

| File | Owns |
| --- | --- |
| src/WexampleSymfonyContentBundle.php | Bundle entry point; declares where the front assets live |
| src/DependencyInjection/WexampleSymfonyContentExtension.php | Loads the service definitions into the container |
| src/Resources/config/services.yaml | Autowires `Command`, `Service` and `Twig` classes |
| src/Command/CheckNodeInstallCommand.php | `content:check-node-install`, run after `composer install` and `update` |
| src/Traits/SymfonyContentBundleClassTrait.php | Names the bundle for the command |
| assets/ts/code-block.ts | `initCodeBlocks()`, the Shiki highlighting pass |
| assets/ts/mermaid.ts | `initMermaid()`, the diagram pass |

PSR-4 maps `Wexample\SymfonyContent\` to `src/`, declared in composer.json.

### Container registration

`WexampleSymfonyContentBundle` extends `AbstractBundle` from `wexample/symfony-helpers`, so Symfony resolves the extension by convention and calls `WexampleSymfonyContentExtension::load()`. That method delegates entirely:

```php
$this->loadConfig(
    __DIR__,
    $container
);
```

`loadConfig()` lives in `AbstractWexampleSymfonyExtension` and builds a `YamlFileLoader` on `$callingDir.'/../Resources/config'`, loading `services.yaml` by default. Adding a second configuration file means passing its name as the third argument, not touching the extension's structure.

The service file registers one namespace prefix, autowired and autoconfigured, non-public:

```yaml
    Wexample\SymfonyContent\:
        resource: '../../{Command,Service,Twig}'
        tags: ['controller.service_arguments']
```

Only `src/Command/` exists today — the other two are there so a service or an extension can be dropped in without editing the file. A class placed anywhere else under `src/` is autoloaded but never registered as a service.

### Front asset declaration

The bundle implements `LoaderBundleInterface`, whose single method `getLoaderFrontPaths(): array` is how the suite's front loader discovers a bundle's assets:

```php
return [
    BundleHelper::getBundleCssAlias(static::class) => __DIR__ . '/../assets/',
];
```

`getBundleCssAlias()` kebab-cases the first two namespace segments and prefixes them with `@`, so this bundle publishes `assets/` under the alias `@wexample/symfony-content`. The directory is also an npm package in its own right — assets/package.json names it `@wexample/symfony-content` and declares `shiki: ^4.0.0` as a peer dependency, left to the consuming application to install.

### Browser side: highlighting

`initCodeBlocks(scope = document)` is an async function, not an auto-running script — the application decides when to call it and on which subtree. It collects two families of elements:

```ts
const classicEls = [...scope.querySelectorAll<HTMLElement>('.code-block[data-lang]')];
const markdownPres = [...scope.querySelectorAll<HTMLElement>('pre:has(> code[class*="language-"])')];
```

The first is markup written by hand, carrying its language in `data-lang`; the second is what a markdown renderer emits, with the language in the `language-*` class. If neither matches, the function returns before doing anything — Shiki is behind `await import('shiki')`, so the highlighter never enters the bundle on a page without code.

The languages of both families are deduplicated into a single `langs` array and one highlighter is created for the whole scope, with the `github-dark` theme hardcoded. Each element is then replaced through `el.outerHTML = highlighter.codeToHtml(...)`, which discards the original node: attributes, listeners and identity on the source element do not survive the pass. A `ShikiTransformer` puts the `code-block` class back on the generated `<pre>`, so styling stays stable across both families and across repeated runs.

### Browser side: diagrams

`initMermaid(scope = document)` takes the blocks a markdown renderer emits for a ```` ```mermaid ```` fence — `pre > code.language-mermaid`, nothing added server-side — and replaces each `<pre>` with a `<figure>` holding the SVG from `mermaid.render()`. Mermaid is behind `await import('mermaid')` like Shiki, so a page without a diagram never loads it, and it runs with `securityLevel: 'strict'` since the source comes from a document. A diagram that does not parse is left as its code block.

`code-block.ts` imports `MERMAID_LANGUAGE_CLASS` from this module and skips those blocks, so the two passes share one definition and can run in either order. Mermaid is a peer dependency, like Shiki.

### Checking the peers

The npm side of this package is its `assets/package.json`, and what it lists there are **peer** dependencies — Shiki and Mermaid are installed by the application, never by this package. The loader compiles every file under `assets/`, so an app that enables the bundle without one of them fails to build on a bare `Module not found`. `content:check-node-install`, run by the composer `post-install-cmd` and `post-update-cmd` scripts, compares that list with the app's `package.json` and names the modules to add.
