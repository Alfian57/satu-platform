<?php

namespace App\Enums;

enum IntegrationConnectionStatus: string
{
    case Disconnected = 'disconnected';
    case Connected = 'connected';
    case Degraded = 'degraded';
}
