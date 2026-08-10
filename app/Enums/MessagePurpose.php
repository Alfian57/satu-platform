<?php

namespace App\Enums;

enum MessagePurpose: string
{
    case Otp = 'otp';
    case Invitation = 'invitation';
    case Deadline = 'deadline';
    case Revision = 'revision';
    case Contact = 'contact';
    case Security = 'security';
}
