<?php

namespace Wexample\SymfonyContent\Command;

use Wexample\SymfonyContent\Traits\SymfonyContentBundleClassTrait;
use Wexample\SymfonyHelpers\Command\AbstractCheckNodeInstallCommand;

class CheckNodeInstallCommand extends AbstractCheckNodeInstallCommand
{
    use SymfonyContentBundleClassTrait;
}
