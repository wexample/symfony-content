<?php

namespace Wexample\SymfonyContent\Twig;

use Symfony\Component\HttpKernel\KernelInterface;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

class MarkdownExtension extends AbstractExtension
{
    public function __construct(
        private readonly KernelInterface $kernel,
    ) {
    }

    public function getFunctions(): array
    {
        return [
            new TwigFunction('markdown_file', $this->markdownFile(...)),
        ];
    }

    public function markdownFile(string $path): string
    {
        $fullPath = $this->kernel->getProjectDir().'/'.$path;

        if (! file_exists($fullPath)) {
            return '';
        }

        return file_get_contents($fullPath);
    }
}
