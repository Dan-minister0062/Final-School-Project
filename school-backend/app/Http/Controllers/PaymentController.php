<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Payment;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Payment::orderBy('id', 'desc');

        // Role-aware scoping
        if ($user && $user->role === 'parent') {
            $query->where(function ($q) use ($user) {
                $q->where('parent_email', $user->email)->orWhere('parent_id', $user->id);
            });
        } elseif ($user && $user->role === 'student') {
            $query->where('student_name', $user->name);
        }

        if ($request->has('status') && $status = $request->input('status')) {
            $query->where('status', $status);
        }
        if ($request->has('month') && $month = $request->input('month')) {
            $query->where('month', (int) $month);
        }
        if ($request->has('year') && $year = $request->input('year')) {
            $query->where('year', (int) $year);
        }
        if ($request->has('q') && $q = trim($request->input('q'))) {
            $query->where(function ($qry) use ($q) {
                $qry->where('student_name', 'like', "%{$q}%")
                    ->orWhere('parent_email', 'like', "%{$q}%")
                    ->orWhere('reference', 'like', "%{$q}%");
            });
        }

        return response()->json([
            'data' => $query->get()->map(fn (Payment $p) => $this->map($p)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        // Admins may create arbitrary payments; parents may submit a receipt
        // that creates their own child's payment for the admin to review.
        if (! $user || ! in_array($user->role, ['admin', 'parent'], true)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $request->validate([
            'student_name' => 'required|string|max:120',
            'amount' => 'required|numeric|min:0',
            'status' => 'sometimes|in:pending,submitted,approved,rejected,paid,cancelled',
        ]);

        $data = $request->only([
            'title', 'category', 'student_name', 'student_code', 'student_id',
            'parent_id', 'parent_email', 'parent_name', 'class_name', 'level',
            'amount', 'method', 'status', 'due_date', 'month', 'year',
            'admission_id', 'date_of_birth', 'gender', 'address', 'city',
            'phone', 'receipt', 'receipt_name', 'notes',
        ]);

        // Parents may only create their own child's payment for review; the
        // billing amount, identities and approval status come from the school.
        if ($user->role === 'parent') {
            $data = array_intersect_key($data, array_flip([
                'title', 'category', 'student_name', 'student_code', 'student_id',
                'class_name', 'level', 'amount', 'method', 'month', 'year',
                'receipt', 'receipt_name', 'notes',
            ]));
            $data['status'] = 'submitted';
            $data['parent_id'] = $user->id;
            $data['parent_email'] = $user->email;
            $data['parent_name'] = $user->name;
            $data['month'] = (int) ($data['month'] ?? now()->month);
            $data['year'] = (int) ($data['year'] ?? now()->year);
        }

        $data['reference'] = $data['reference'] ?? 'PAY-' . strtoupper(uniqid());

        $existing = Payment::where('reference', $data['reference'])->exists();
        if ($existing) {
            $data['reference'] = 'PAY-' . strtoupper(uniqid());
        }

        $data['created_by'] = $user->id;

        if ($user->role === 'parent') {
            $data['status'] = 'submitted';
        } else {
            $data['status'] = $request->input('status', 'pending');
            if (in_array($data['status'], ['approved', 'paid'], true)) {
                $data['paid_at'] = $data['paid_at'] ?? now();
            }
        }

        $payment = Payment::create($data);

        if ($user->role === 'parent') {
            $this->createAdminSubmissionNotification($payment);
        }

        return response()->json([
            'success' => true,
            'data' => $this->map($payment),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $payment = Payment::findOrFail($id);
        $user = $request->user();

        if ($user && $user->role === 'parent' && ! $this->ownedBy($payment, $user)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $request->validate([
            'amount' => 'sometimes|numeric|min:0',
            'status' => 'sometimes|in:pending,submitted,approved,rejected,paid,cancelled',
        ]);

        $data = $request->only([
            'title', 'category', 'student_name', 'student_code', 'student_id',
            'parent_id', 'parent_email', 'parent_name', 'class_name', 'level',
            'amount', 'method', 'status', 'due_date', 'month', 'year',
            'admission_id', 'date_of_birth', 'gender', 'address', 'city',
            'phone', 'receipt', 'receipt_name', 'notes',
        ]);

        // Parents may only touch safe fields on their own payments: they cannot
        // rewrite billing amounts, identities or approval status.
        if ($user && $user->role === 'parent') {
            $data = array_intersect_key($data, array_flip([
                'amount', 'method', 'status', 'receipt', 'receipt_name', 'notes',
            ]));
            if (isset($data['status']) && ! in_array($data['status'], ['pending', 'submitted', 'cancelled'], true)) {
                unset($data['status']);
            }
        }

        if (array_key_exists('status', $data) && in_array($data['status'], ['approved', 'paid'], true) && !$payment->paid_at) {
            $data['paid_at'] = now();
        }

        $payment->update($data);

        return response()->json([
            'success' => true,
            'data' => $this->map($payment),
        ]);
    }

    public function status(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:pending,submitted,approved,rejected,paid,cancelled',
        ]);

        $payment = Payment::findOrFail($id);
        $user = $request->user();
        $status = $request->input('status');

        if ($user && $user->role === 'parent') {
            if (! $this->ownedBy($payment, $user) || $status !== 'submitted') {
                return response()->json(['message' => 'Forbidden.'], 403);
            }
        } elseif (! $user || $user->role !== 'admin') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $patch = [
            'status' => $status,
            'paid_at' => in_array($status, ['approved', 'paid'], true) ? now() : null,
        ];

        if ($request->has('method')) {
            $patch['method'] = $request->input('method');
        }
        if ($request->has('notes')) {
            $patch['notes'] = $request->input('notes');
        }
        if ($request->has('receipt')) {
            $patch['receipt'] = $request->input('receipt');
        }
        if ($request->has('receipt_name')) {
            $patch['receipt_name'] = $request->input('receipt_name');
        }

        $payment->update($patch);

        // Notify BOTH the parent and the student personally when an admin
        // approves or rejects a payment, so each receives the message in
        // their own notification inbox (rows stored in the DB and fetched
        // through GET /notifications).
        if (in_array($status, ['approved', 'rejected'], true)) {
            $this->createPaymentNotifications($payment, $status);
        } elseif ($status === 'submitted' && $user && $user->role === 'parent') {
            $this->createAdminSubmissionNotification($payment);
        }

        return response()->json([
            'success' => true,
            'data' => $this->map($payment),
        ]);
    }

    protected function createPaymentNotifications(Payment $payment, string $status): void
    {
        $approved = $status === 'approved';
        $monthName = $payment->month
            ? date('F', mktime(0, 0, 0, (int) $payment->month, 1))
            : '';
        $message = sprintf(
            'Payment of %s MAD for %s (%s %s) has been %s.',
            number_format((float) $payment->amount, 2),
            $payment->student_name ?: 'Student',
            $monthName,
            $payment->year,
            $approved ? 'approved' : 'rejected'
        );
        $metadata = [
            'payment_id' => $payment->id,
            'reference' => $payment->reference,
            'status' => $status,
            'student_name' => $payment->student_name,
            'amount' => (float) $payment->amount,
            'month' => $payment->month,
            'year' => $payment->year,
        ];

        $recipients = [];

        $parentUser = null;
        if ($payment->parent_id) {
            $parentUser = User::where('id', $payment->parent_id)->where('role', 'parent')->first();
        }
        if (! $parentUser && $payment->parent_email) {
            $parentUser = User::where('email', $payment->parent_email)->where('role', 'parent')->first();
        }
        if ($parentUser) {
            $recipients[$parentUser->id] = '/dashboard/parent/payments';
        }

        $studentUser = null;
        if ($payment->student_id) {
            $studentUser = User::where('id', $payment->student_id)->where('role', 'student')->first();
        }
        if (! $studentUser && $payment->student_name) {
            $studentUser = User::where('name', $payment->student_name)->where('role', 'student')->first();
        }
        if (! $studentUser && $payment->student_name) {
            $studentId = Student::where('name', $payment->student_name)->value('id');
            if ($studentId) {
                $studentUser = User::where('student_id', $studentId)->where('role', 'student')->first();
            }
        }
        if ($studentUser) {
            $recipients[$studentUser->id] = '/dashboard/student/payments';
        }

        $title = $approved ? '✅ Payment Approved' : '❌ Payment Rejected';

        foreach ($recipients as $recipientId => $link) {
            Notification::create([
                'title' => $title,
                'message' => $message,
                'type' => 'payment',
                'audience' => 'all',
                'user_id' => $recipientId,
                'link' => $link,
                'priority' => 'medium',
                'metadata' => $metadata,
            ]);
        }
    }

    // Notify the admins when a parent submits a receipt so they can approve
    // or reject it. Each admin gets their own stored notification row.
    protected function createAdminSubmissionNotification(Payment $payment): void
    {
        $monthName = $payment->month
            ? date('F', mktime(0, 0, 0, (int) $payment->month, 1))
            : '';
        $message = sprintf(
            'A payment receipt for %s (%s %s) — %s MAD — is pending your review.',
            $payment->student_name ?: 'Student',
            $monthName,
            $payment->year,
            number_format((float) $payment->amount, 2)
        );
        $metadata = [
            'payment_id' => $payment->id,
            'reference' => $payment->reference,
            'status' => 'submitted',
            'student_name' => $payment->student_name,
            'amount' => (float) $payment->amount,
            'month' => $payment->month,
            'year' => $payment->year,
        ];

        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            Notification::create([
                'title' => '📥 Payment Receipt Submitted',
                'message' => $message,
                'type' => 'payment',
                'audience' => 'admin',
                'user_id' => $admin->id,
                'link' => '/dashboard/admin/payments',
                'priority' => 'high',
                'metadata' => $metadata,
            ]);
        }
    }

    protected function ownedBy(Payment $payment, \App\Models\User $user): bool
    {
        return $payment->parent_id === $user->id
            || ($payment->parent_email && $payment->parent_email === $user->email);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        Payment::findOrFail($id)->delete();

        return response()->json(['success' => true]);
    }

    protected function map(Payment $p): array
    {
        return [
            'id' => $p->id,
            'reference' => $p->reference,
            'title' => $p->title,
            'category' => $p->category ?? 'tuition',
            'student_id' => $p->student_id,
            'student_code' => $p->student_code,
            'student_name' => $p->student_name,
            'studentName' => $p->student_name,
            'parent_id' => $p->parent_id,
            'parent_email' => $p->parent_email,
            'parentEmail' => $p->parent_email,
            'parent_name' => $p->parent_name,
            'parentName' => $p->parent_name,
            'class_name' => $p->class_name,
            'className' => $p->class_name,
            'level' => $p->level,
            'month' => $p->month,
            'year' => $p->year,
            'admission_id' => $p->admission_id,
            'admissionId' => $p->admission_id,
            'amount' => (float) $p->amount,
            'method' => $p->method,
            'status' => $p->status,
            'due_date' => $p->due_date,
            'dueDate' => $p->due_date,
            'paid_at' => $p->paid_at?->toIso8601String(),
            'paidAt' => $p->paid_at?->toIso8601String(),
            'date_of_birth' => $p->date_of_birth?->format('Y-m-d'),
            'dateOfBirth' => $p->date_of_birth?->format('Y-m-d'),
            'gender' => $p->gender,
            'address' => $p->address,
            'city' => $p->city,
            'phone' => $p->phone,
            'receipt' => $p->receipt,
            'receipt_name' => $p->receipt_name,
            'receiptName' => $p->receipt_name,
            'notes' => $p->notes,
            'created_by' => $p->created_by,
            'createdAt' => $p->created_at?->toIso8601String(),
            'created_at' => $p->created_at?->toIso8601String(),
            'updatedAt' => $p->updated_at?->toIso8601String(),
            'updated_at' => $p->updated_at?->toIso8601String(),
            '_serverId' => $p->id,
            'source' => 'server',
        ];
    }
}