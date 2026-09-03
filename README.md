# symfony_content

Version: 2.0.1

`wexample/symfony-content` is a small Symfony bundle for rendering authored content — Markdown files and the code blocks inside them — in an application's Twig templates. It registers a `markdown_file` Twig function that reads a file relative to the kernel's project directory (src/Twig/MarkdownExtension.php), and ships a front asset, assets/ts/code-block.ts, that highlights `.code-block[data-lang]` elements and Markdown `<pre><code class="language-…">` blocks with Shiki. It targets Symfony 8.2+ projects already built on `wexample/symfony-helpers`, where documentation or editorial pages live as Markdown files in the repository rather than in a database.

## Table of Contents

- [Architecture](#architecture)
- [Integration in the Suite](#integration-in-the-suite)
- [Dependencies](#dependencies)
- [Versioning & Compatibility Policy](#versioning--compatibility-policy)
- [License](#license)
- [About us](#about-us)
- [Migration Notes](#migration-notes)

## Architecture

The package is a Symfony bundle with three PHP classes and one TypeScript module. It owns no entity, no controller and no template: it exposes a Twig function that reads a project file, and a browser-side script that re-renders code blocks. Everything else is registration plumbing.

### The pieces

| File | Owns |
| --- | --- |
| src/WexampleSymfonyContentBundle.php | Bundle entry point; declares where the front assets live |
| src/DependencyInjection/WexampleSymfonyContentExtension.php | Loads the service definitions into the container |
| src/Resources/config/services.yaml | Autowires `Service` and `Twig` classes |
| src/Twig/MarkdownExtension.php | The `markdown_file()` Twig function |
| assets/ts/code-block.ts | `initCodeBlocks()`, the Shiki highlighting pass |

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
        resource: '../../{Service,Twig}'
        tags: ['controller.service_arguments']
```

Only `src/Twig/` exists today — the `Service` half of the brace matches nothing, and is there so a service class can be dropped in without editing the file. A class placed anywhere else under `src/` is autoloaded but never registered as a service.

### Front asset declaration

The bundle implements `LoaderBundleInterface`, whose single method `getLoaderFrontPaths(): array` is how the suite's front loader discovers a bundle's assets:

```php
return [
    BundleHelper::getBundleCssAlias(static::class) => __DIR__ . '/../assets/',
];
```

`getBundleCssAlias()` kebab-cases the first two namespace segments and prefixes them with `@`, so this bundle publishes `assets/` under the alias `@wexample/symfony-content`. The directory is also an npm package in its own right — assets/package.json names it `@wexample/symfony-content` and declares `shiki: ^4.0.0` as a peer dependency, left to the consuming application to install.

### Server side: reading a markdown file

`MarkdownExtension` registers a single function and takes `KernelInterface` by constructor injection:

```php
new TwigFunction('markdown_file', $this->markdownFile(...)),
```

The call path is short. `markdownFile()` joins the argument to `$this->kernel->getProjectDir()`, returns `''` when the file is absent, and otherwise returns `file_get_contents($fullPath)` — the raw markdown, unconverted and unescaped. Two consequences worth knowing before extending it: the path is resolved against the project directory, so it addresses application files rather than bundle ones, and it is interpolated with no traversal check, so it is not meant to receive user input.

Conversion to HTML is not this package's job. composer.json requires `twig/markdown-extra: ^3.0` so the returned string can be piped through that library's markdown filter in the template; no PHP file here references it.

### Browser side: highlighting

`initCodeBlocks(scope = document)` is an async function, not an auto-running script — the application decides when to call it and on which subtree. It collects two families of elements:

```ts
const classicEls = [...scope.querySelectorAll<HTMLElement>('.code-block[data-lang]')];
const markdownPres = [...scope.querySelectorAll<HTMLElement>('pre:has(> code[class*="language-"])')];
```

The first is markup written by hand, carrying its language in `data-lang`; the second is what a markdown renderer emits, with the language in the `language-*` class. If neither matches, the function returns before doing anything — Shiki is behind `await import('shiki')`, so the highlighter never enters the bundle on a page without code.

The languages of both families are deduplicated into a single `langs` array and one highlighter is created for the whole scope, with the `github-dark` theme hardcoded. Each element is then replaced through `el.outerHTML = highlighter.codeToHtml(...)`, which discards the original node: attributes, listeners and identity on the source element do not survive the pass. A `ShikiTransformer` puts the `code-block` class back on the generated `<pre>`, so styling stays stable across both families and across repeated runs.

## Integration in the Suite

This package is part of the Wexample Suite — a collection of high-quality, modular tools designed to work seamlessly together across multiple languages and environments.

### Related Packages

The suite includes packages for configuration management, file handling, prompts, and more. Each package can be used independently or as part of the integrated suite.

Visit the [Wexample Suite documentation](https://docs.wexample.com) for the complete package ecosystem.

## Dependencies

- php: >=8.2
- wexample/symfony-helpers: >=6.0.0
- twig/markdown-extra: ^3.0

## Versioning & Compatibility Policy

Wexample packages follow **Semantic Versioning** (SemVer):

- **MAJOR**: Breaking changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

We maintain backward compatibility within major versions and provide clear migration guides for breaking changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Free to use in both personal and commercial projects.

## About us

[Wexample](https://wexample.com) stands as a cornerstone of the digital ecosystem — a collective of seasoned engineers, researchers, and creators driven by a relentless pursuit of technological excellence. More than a media platform, it has grown into a vibrant community where innovation meets craftsmanship, and where every line of code reflects a commitment to clarity, durability, and shared intelligence.

This packages suite embodies this spirit. Trusted by professionals and enthusiasts alike, it delivers a consistent, high-quality foundation for modern development — open, elegant, and battle-tested. Its reputation is built on years of collaboration, refinement, and rigorous attention to detail, making it a natural choice for those who demand both robustness and beauty in their tools.

Wexample cultivates a culture of mastery. Each package, each contribution carries the mark of a community that values precision, ethics, and innovation — a community proud to shape the future of digital craftsmanship.

## Migration Notes

When upgrading between major versions, refer to the migration guides in the documentation.

Breaking changes are clearly documented with upgrade paths and examples.
