'use client';

import { useState } from 'react';
import { useSidebar } from '@/components/contexts/SidebarContext';
import Container from '@/components/ui/pages/dashboard/common/Container';
import Breadcrumb from '@/components/ui/pages/dashboard/Breadcrumb';
import { useTranslate } from '@/components/hooks/useTranslate';
import { TuitionBill } from '@/types/student';
import { toastUtils } from '@/components/lib/toast';
import {
  BiHomeSmile,
  BiCreditCard,
  BiCheckCircle,
  BiTimeFive,
  BiDownload,
  BiReceipt,
  BiDollarCircle,
  BiShield,
} from 'react-icons/bi';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const SAMPLE_BILLS: TuitionBill[] = [
  {
    id: 101,
    invoice_no: 'INV-2026-0501',
    month: 'May 2026 (মে ২০২৬)',
    tutor_name: 'Engr. Tanvir Ahmed (BUET)',
    subject: 'General Math & Physics',
    tuition_fee: 8000,
    platform_charge: 200,
    total_amount: 8200,
    status: 'unpaid',
    due_date: '2026-05-10',
  },
  {
    id: 100,
    invoice_no: 'INV-2026-0401',
    month: 'April 2026 (এপ্রিল ২০২৬)',
    tutor_name: 'Engr. Tanvir Ahmed (BUET)',
    subject: 'General Math & Physics',
    tuition_fee: 8000,
    platform_charge: 200,
    total_amount: 8200,
    status: 'paid',
    due_date: '2026-04-10',
    payment_method: 'bKash Online',
    paid_at: '2026-04-05 08:30 PM',
  },
  {
    id: 99,
    invoice_no: 'INV-2026-0301',
    month: 'March 2026 (মার্চ ২০২৬)',
    tutor_name: 'Nusrat Jahan (DMC)',
    subject: 'Biology & Chemistry',
    tuition_fee: 7500,
    platform_charge: 200,
    total_amount: 7700,
    status: 'paid',
    due_date: '2026-03-10',
    payment_method: 'Nagad Gateway',
    paid_at: '2026-03-04 11:15 AM',
  },
];

export default function TuitionFeesPage() {
  const translate = useTranslate();
  const { collapsed } = useSidebar();

  const [bills, setBills] = useState<TuitionBill[]>(SAMPLE_BILLS);
  const [activeTab, setActiveTab] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [payingBill, setPayingBill] = useState<TuitionBill | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'bkash' | 'nagad' | 'card'>('bkash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<TuitionBill | null>(null);

  const breadcrumbItems = [
    {
      label: translate('home') || 'Home',
      href: '/student/dashboard',
      icon: <BiHomeSmile className="w-5 h-5" />,
    },
    {
      label: translate('tuitionFees') || 'Tuition Bills & Payments',
    },
  ];

  const filteredBills = bills.filter((b) => {
    if (activeTab === 'all') return true;
    return b.status === activeTab;
  });

  const totalPaid = bills
    .filter((b) => b.status === 'paid')
    .reduce((sum, b) => sum + b.total_amount, 0);

  const totalDue = bills
    .filter((b) => b.status === 'unpaid')
    .reduce((sum, b) => sum + b.total_amount, 0);

  const handlePayNow = () => {
    if (!payingBill) return;
    setIsProcessing(true);

    setTimeout(() => {
      setBills((prev) =>
        prev.map((item) =>
          item.id === payingBill.id
            ? {
                ...item,
                status: 'paid',
                payment_method: selectedMethod.toUpperCase() + ' Payment',
                paid_at: new Date().toLocaleString(),
              }
            : item
        )
      );
      setIsProcessing(false);
      setPayingBill(null);
      toastUtils.success(
        `Payment of ৳ ${payingBill.total_amount.toLocaleString()} successful! Invoice ${payingBill.invoice_no} is marked as paid.`
      );
    }, 1200);
  };

  return (
    <Container collapsed={collapsed}>
      <Breadcrumb
        title={translate('tuitionFees') || 'Tuition Bills (টিউশন সম্মানী ও ফি)'}
        items={breadcrumbItems}
      />

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <BiTimeFive className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Pending Due Bills</p>
            <p className="text-xl font-bold text-amber-600">৳ {totalDue.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <BiCheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Paid This Year</p>
            <p className="text-xl font-bold text-emerald-600">৳ {totalPaid.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <BiShield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Payment Protection</p>
            <p className="text-sm font-bold text-gray-800">100% Escrow Protected</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-2">
        {[
          { key: 'all', label: 'All Invoices' },
          { key: 'unpaid', label: `Due / Unpaid (${bills.filter((b) => b.status === 'unpaid').length})` },
          { key: 'paid', label: `Paid (${bills.filter((b) => b.status === 'paid').length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'all' | 'unpaid' | 'paid')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === tab.key
                ? 'bg-(--primary-color) text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        {filteredBills.map((bill) => (
          <div
            key={bill.id}
            className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 shadow-xs hover:border-gray-300 transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-gray-100 text-gray-800">
                    {bill.invoice_no}
                  </span>
                  {bill.status === 'paid' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <BiCheckCircle className="w-3.5 h-3.5" />
                      Paid (পরিশোধিত)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <BiTimeFive className="w-3.5 h-3.5" />
                      Due (বকেয়া)
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-gray-900">{bill.month}</h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  Tutor: <strong className="text-gray-800">{bill.tutor_name}</strong> • Subject: {bill.subject}
                </p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="text-xs text-gray-500">Total Payable</span>
                <p className="text-xl font-bold text-(--primary-color)">
                  ৳ {bill.total_amount.toLocaleString()}
                </p>
                <p className="text-[11px] text-gray-400">Due: {bill.due_date}</p>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl text-xs text-gray-600 mb-4 border border-gray-100">
              <div>
                <span className="text-gray-400 block">Tutor Remuneration:</span>
                <span className="font-semibold text-gray-800">৳ {bill.tuition_fee.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Platform & Processing Fee:</span>
                <span className="font-semibold text-gray-800">৳ {bill.platform_charge.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Status / Method:</span>
                <span className="font-semibold text-gray-800">
                  {bill.status === 'paid' ? bill.payment_method || 'Online' : 'Awaiting Payment'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              {bill.status === 'paid' ? (
                <button
                  onClick={() => setViewingReceipt(bill)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <BiReceipt className="w-4 h-4 text-emerald-600" />
                  View Receipt (রসিদ দেখুন)
                </button>
              ) : (
                <button
                  onClick={() => setPayingBill(bill)}
                  className="px-5 py-2 rounded-xl bg-(--primary-color) text-white text-xs font-semibold hover:opacity-90 transition shadow-xs flex items-center gap-1.5"
                >
                  <BiCreditCard className="w-4 h-4" />
                  Pay Now (পরিশোধ করুন)
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Payment Gateway Modal */}
      <Dialog
        open={Boolean(payingBill)}
        onOpenChange={(open) => {
          if (!open && !isProcessing) setPayingBill(null);
        }}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[460px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">
              Pay Tuition Fee (টিউশন ফি পরিশোধ)
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 mt-1">
              Invoice: {payingBill?.invoice_no} — {payingBill?.month}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-700 font-medium">Total Amount to Pay</p>
                <p className="text-2xl font-bold text-emerald-800">
                  ৳ {payingBill?.total_amount.toLocaleString()}
                </p>
              </div>
              <div className="text-xs text-right text-emerald-700">
                <p>Tutor: ৳ {payingBill?.tuition_fee.toLocaleString()}</p>
                <p>Platform: ৳ {payingBill?.platform_charge.toLocaleString()}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Select Payment Method (পেমেন্ট মাধ্যম বেছে নিন)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'bkash', label: 'bKash (বিকাশ)', color: 'border-pink-500' },
                  { id: 'nagad', label: 'Nagad (নগদ)', color: 'border-orange-500' },
                  { id: 'card', label: 'Card / Net', color: 'border-blue-500' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMethod(m.id as 'bkash' | 'nagad' | 'card')}
                    className={`p-3 rounded-xl border text-xs font-bold text-center transition ${
                      selectedMethod === m.id
                        ? `${m.color} bg-gray-50 text-gray-900 ring-2 ring-(--primary-color)/30`
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-gray-500 text-center">
              🔒 256-bit encrypted secure transaction. Payment will be held in escrow until session completion.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setPayingBill(null)}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handlePayNow}
              className="px-6 py-2 rounded-xl bg-(--primary-color) text-white text-xs font-semibold hover:opacity-90 transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isProcessing ? 'Processing Payment...' : `Confirm Pay ৳ ${payingBill?.total_amount.toLocaleString()}`}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <Dialog
        open={Boolean(viewingReceipt)}
        onOpenChange={(open) => {
          if (!open) setViewingReceipt(null);
        }}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[480px] p-6 rounded-2xl">
          <DialogHeader className="border-b border-gray-100 pb-3">
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <BiReceipt className="w-5 h-5 text-emerald-600" />
              Tuition Payment Receipt (অর্থ প্রদানের রসিদ)
            </DialogTitle>
          </DialogHeader>

          {viewingReceipt && (
            <div className="space-y-3 py-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Invoice Number:</span>
                <span className="font-mono font-bold text-gray-800">{viewingReceipt.invoice_no}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Month / Session:</span>
                <span className="font-semibold text-gray-800">{viewingReceipt.month}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Assigned Tutor:</span>
                <span className="font-semibold text-gray-800">{viewingReceipt.tutor_name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Subject:</span>
                <span className="font-semibold text-gray-800">{viewingReceipt.subject}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Tutor Remuneration:</span>
                <span className="font-semibold text-gray-800">৳ {viewingReceipt.tuition_fee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Platform Charge:</span>
                <span className="font-semibold text-gray-800">৳ {viewingReceipt.platform_charge.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b-2 border-gray-200 text-sm font-bold">
                <span className="text-gray-900">Total Paid:</span>
                <span className="text-(--primary-color)">৳ {viewingReceipt.total_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 text-gray-500">
                <span>Payment Method:</span>
                <span className="font-medium text-gray-700">{viewingReceipt.payment_method}</span>
              </div>
              <div className="flex justify-between py-1 text-gray-500">
                <span>Paid Date:</span>
                <span className="font-medium text-gray-700">{viewingReceipt.paid_at}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setViewingReceipt(null)}
              className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
