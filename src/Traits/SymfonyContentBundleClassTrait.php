<?php

namespace Wexample\SymfonyContent\Traits;

use Wexample\SymfonyContent\WexampleSymfonyContentBundle;
use Wexample\SymfonyHelpers\Traits\BundleClassTrait;

trait SymfonyContentBundleClassTrait
{
    use BundleClassTrait;

    public static function getBundleClassName(): string
    {
        return WexampleSymfonyContentBundle::class;
    }
}
