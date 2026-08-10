<?php

namespace App\Enums;

enum OtpPurpose: string
{
    case Registration = 'registration';
    case Recovery = 'recovery';
    case Invitation = 'invitation';
    case PhoneChange = 'phone_change';
}
