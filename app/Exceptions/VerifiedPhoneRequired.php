<?php

namespace App\Exceptions;

use Illuminate\Auth\Access\AuthorizationException;

final class VerifiedPhoneRequired extends AuthorizationException
{
    public function __construct()
    {
        parent::__construct('A verified WhatsApp number is required for affiliation matching.');
    }
}
