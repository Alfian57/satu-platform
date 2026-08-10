<?php

namespace App\Enums;

enum IntegrationProviderMode: string
{
    case Sandbox = 'sandbox';
    case Real = 'real';
}
