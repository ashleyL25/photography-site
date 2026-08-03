<?php
/**
 * Inquiry form handler for Hostinger shared hosting.
 *
 * The React form POSTs JSON here; this validates it and sends a mail.
 *
 * BEFORE GOING LIVE:
 *   1. Set $TO to the real inbox.
 *   2. Set $FROM to an address on this domain — Hostinger (and most hosts)
 *      reject mail whose From: header is a Gmail/Outlook address.
 */

declare(strict_types=1);

$TO   = 'ashleydesignia@gmail.com';
$FROM = 'no-reply@photosbyashley.com'; // must stay on this domain for Hostinger mail

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

$field = static fn (string $key): string => trim((string)($data[$key] ?? ''));

$name      = $field('name');
$email     = $field('email');
$session   = $field('session');
$message   = $field('message');
$phone     = $field('phone');
$tier      = $field('tier');
$timeframe = $field('timeframe');
$location  = $field('location');
$heardFrom = $field('heardFrom');

$errors = [];
if ($name === '' || mb_strlen($name) > 120) {
    $errors[] = 'name';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'email';
}
if ($session === '' || mb_strlen($session) > 120) {
    $errors[] = 'session';
}
if ($timeframe === '' || mb_strlen($timeframe) > 120) {
    $errors[] = 'timeframe';
}
if ($message === '' || mb_strlen($message) > 5000) {
    $errors[] = 'message';
}
// The optional fields are not required, but they are still bounded — anything
// unbounded that reaches the mail body is a spam vector.
foreach (['phone' => $phone, 'tier' => $tier, 'location' => $location, 'heardFrom' => $heardFrom] as $key => $value) {
    if (mb_strlen($value) > 200) {
        $errors[] = $key;
    }
}

if ($errors) {
    http_response_code(422);
    echo json_encode(['error' => 'Invalid fields', 'fields' => $errors]);
    exit;
}

// Strip CR/LF from anything that lands in a header, or the form becomes an
// open relay for injected Bcc: lines.
$safeHeader = static fn (string $v): string => str_replace(["\r", "\n"], ' ', $v);

$rows = [
    'Name'      => $name,
    'Email'     => $email,
    'Phone'     => $phone,
    'Session'   => $session,
    'Tier'      => $tier,
    'Timeframe' => $timeframe,
    'Location'  => $location,
    'Found via' => $heardFrom,
    'Sent'      => date('Y-m-d H:i:s T'),
];

$body = "New inquiry from the website\n\n";
foreach ($rows as $label => $value) {
    if ($value === '') {
        continue; // Skip the optional fields nobody filled in.
    }
    $body .= str_pad($label . ':', 12) . $value . "\n";
}
$body .= "\n-----\n\n{$message}\n";

$headers = implode("\r\n", [
    'From: Ashley Photography <' . $FROM . '>',
    'Reply-To: ' . $safeHeader($name) . ' <' . $safeHeader($email) . '>',
    'Content-Type: text/plain; charset=utf-8',
    'X-Mailer: PHP/' . phpversion(),
]);

$sent = mail(
    $TO,
    '[Website] ' . $safeHeader($session) . ' — ' . $safeHeader($name),
    $body,
    $headers
);

if (!$sent) {
    http_response_code(502);
    echo json_encode(['error' => 'Mail transport failed']);
    exit;
}

echo json_encode(['ok' => true]);
