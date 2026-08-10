<?php

declare(strict_types=1);

namespace App\Enums;

enum ContactRequestStatus: string
{
    case Pending = 'pending';
    case Accepted = 'accepted';
    case Declined = 'declined';
    case Expired = 'expired';
    case Canceled = 'canceled';
}
