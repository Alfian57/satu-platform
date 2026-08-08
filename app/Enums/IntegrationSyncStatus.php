<?php

namespace App\Enums;

enum IntegrationSyncStatus: string
{
    case Queued = 'queued';
    case Sending = 'sending';
    case Succeeded = 'succeeded';
    case Failed = 'failed';
    case Retrying = 'retrying';
    case Dead = 'dead';
    case Timeout = 'timeout';
    case ValidationError = 'validation_error';
    case Conflict = 'conflict';
    case Reconciled = 'reconciled';
}
