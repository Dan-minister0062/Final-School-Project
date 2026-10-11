<?php

namespace App\Support;

/**
 * Turns inline `data:` URIs into real files that the web server can serve,
 * storing the resulting absolute URL instead of the base64 blob. Plain URLs
 * and paths pass through untouched, so existing rows and non-media payloads
 * are never rewritten.
 */
class MediaStore
{
    private const MIME_EXT = [
        'image/jpeg' => 'jpg',
        'image/jpg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp',
        'image/bmp' => 'bmp',
        'image/svg+xml' => 'svg',
        'video/mp4' => 'mp4',
        'video/webm' => 'webm',
        'video/ogg' => 'ogv',
        'video/quicktime' => 'mov',
        'video/x-msvideo' => 'avi',
        'application/pdf' => 'pdf',
    ];

    /**
     * Persist a data URI carrier to public/uploads/{$folder}/ and return its
     * absolute URL. Anything that is not a base64 data URI is returned as-is.
     */
    public static function toUrl(?string $value, string $folder): ?string
    {
        if ($value === null || $value === '') {
            return $value;
        }

        if (! preg_match('#^data:([^;,]+);base64,(.*)$#s', $value, $m)) {
            return $value;
        }

        $mime = strtolower(trim($m[1]));
        $binary = base64_decode($m[2], true);

        if ($binary === false || $binary === '') {
            return $value;
        }

        $ext = self::MIME_EXT[$mime] ?? 'bin';
        $name = date('Ymd_His').'_'.bin2hex(random_bytes(6)).'.'.$ext;

        $dir = public_path('uploads'.DIRECTORY_SEPARATOR.$folder);
        if (! is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }

        $path = $dir.DIRECTORY_SEPARATOR.$name;

        if (file_put_contents($path, $binary) === false) {
            return $value;
        }

        return url('uploads/'.$folder.'/'.$name);
    }
}