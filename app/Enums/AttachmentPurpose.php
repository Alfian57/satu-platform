<?php

declare(strict_types=1);

namespace App\Enums;

enum AttachmentPurpose: string
{
    case Attachment = 'attachment';
    case Evidence = 'evidence';
}
