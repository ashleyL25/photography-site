<?php
/**
 * Enquiry form handler for Hostinger shared hosting.
 *
 * The React form POSTs JSON here; this validates it and sends a mail.
 *
 * BEFORE GOING LIVE:
 *   1. Set $TO to the real inbox.
 *   2. Set $FROM to an address on this domain — Hostinger (and most hosts)
 *      reject mail whose From: header is a Gmail/Outlook address.
 */

declare(strict_types=1);

$TO   = 'hello@photosbyashley.com';
$FROM = 'no-reply@photosbyashley.com';

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['error' => 'Malformed request']);
    exit;
}

// Honeypot — a filled hidden field means a bot. Answer 200 so it does not retry.
if (!empty($data['website'])) {
    echo json_encode(['ok' => true]);
    exit;
}

$name    = trim((string)($data['name'] ?? ''));
$email   = trim((string)($data['email'] ?? ''));
$subject = trim((string)($data['subject'] ?? ''));
$message = trim((string)($data['message'] ?? ''));

$errors = [];
if ($name === '' || mb_strlen($name) > 120) {
    $errors[] = 'name';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'email';
}
if ($subject === '' || mb_strlen($subject) > 120) {
    $errors[] = 'subject';
}
if ($message === '' || mb_strlen($message) > 5000) {
    $errors[] = 'message';
}

if ($errors) {
    http_response_code(422);
    echo json_encode(['error' => 'Invalid fields', 'fields' => $errors]);
    exit;
}

// Strip CR/LF from anything that lands in a header, or the form becomes an
// open relay for injected Bcc: lines.
$safeHeader = static fn (string $v): string => str_replace(["\r", "\n"], ' ', $v);

$body = "New enquiry from the website\n\n"
      . "Name:    {$name}\n"
      . "Email:   {$email}\n"
      . "Subject: {$subject}\n"
      . 'Sent:    ' . date('Y-m-d H:i:s T') . "\n\n"
      . "-----\n\n{$message}\n";

$headers = implode("\r\n", [
    'From: Ashley Photography <' . $FROM . '>',
    'Reply-To: ' . $safeHeader($name) . ' <' . $safeHeader($email) . '>',
    'Content-Type: text/plain; charset=utf-8',
    'X-Mailer: PHP/' . phpversion(),
]);

$sent = mail(
    $TO,
    '[Website] ' . $safeHeader($subject) . ' — ' . $safeHeader($name),
    $body,
    $headers
);

if (!$sent) {
    http_response_code(502);
    echo json_encode(['error' => 'Mail transport failed']);
    exit;
}

echo json_encode(['ok' => true]);
