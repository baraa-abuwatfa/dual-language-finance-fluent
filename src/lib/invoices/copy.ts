const en = {
  title: "Invoices", intro: "Private company invoices", upload: "Upload invoice", formats: "PDF · JPG · JPEG · PNG · 10 MB", search: "Search file, supplier or invoice number", all: "All statuses",
  status: { uploaded: "Uploaded", processing: "Processing", needs_review: "Needs Review", approved: "Approved", failed: "Failed" },
  supplier_name: "Supplier name", invoice_number: "Invoice number", invoice_date: "Invoice date", due_date: "Due date", currency: "Currency", subtotal: "Subtotal", tax_amount: "Tax amount", total_amount: "Total amount", expense_category: "Expense category",
  extract: "Extract invoice", review: "Review invoice", save: "Save review", approve: "Confirm and record expense", approved: "Expense recorded", open: "Open file", empty: "No invoices uploaded yet.", noMatch: "No invoices match your filters.",
  notice: "Review all fields before confirming. No expense is recorded until you confirm.", duplicate: "This supplier and invoice number already exist in this company. No expense was added.",
  invalid: "Complete the required fields, check the dates, and make sure subtotal plus tax equals total.", currencyMismatch: "Invoice currency must match the company currency. Currency conversion is not configured; no expense was recorded.",
  failed: "The action failed. Please try again.", setup: "Invoice processing needs a database update in the existing account service. Uploads and file history remain available.", fileType: "Only PDF, JPG, JPEG and PNG files are supported.", fileTooLarge: "Choose a non-empty file up to 10 MB.",
  working: "Please wait…", close: "Close", retry: "Try again", readonly: "Your role can view invoices but cannot change them.", transaction: "Linked expense", missingAI: "AI extraction is not configured. You can enter the invoice fields manually.", busy: "This invoice is already processing. Reload its status before starting another extraction.",
  saved: "Review saved. No expense is recorded until you confirm.",
};
type Copy = typeof en;
const ar: Copy = {
  title: "الفواتير", intro: "فواتير خاصة بالشركة", upload: "رفع فاتورة", formats: "PDF · JPG · JPEG · PNG · 10 MB", search: "ابحث بالملف أو المورد أو رقم الفاتورة", all: "كل الحالات",
  status: { uploaded: "تم الرفع", processing: "قيد المعالجة", needs_review: "تحتاج مراجعة", approved: "معتمدة", failed: "فشلت المعالجة" },
  supplier_name: "اسم المورد", invoice_number: "رقم الفاتورة", invoice_date: "تاريخ الفاتورة", due_date: "تاريخ الاستحقاق", currency: "العملة", subtotal: "المجموع الفرعي", tax_amount: "مبلغ الضريبة", total_amount: "الإجمالي", expense_category: "فئة المصروف",
  extract: "استخراج بيانات الفاتورة", review: "مراجعة الفاتورة", save: "حفظ المراجعة", approve: "تأكيد وتسجيل المصروف", approved: "تم تسجيل المصروف", open: "فتح الملف", empty: "لم تُرفع أي فواتير بعد.", noMatch: "لا توجد فواتير تطابق البحث.",
  notice: "راجع جميع البيانات قبل التأكيد. لن يُسجَّل أي مصروف حتى تؤكد ذلك.", duplicate: "يوجد هذا المورد ورقم الفاتورة بالفعل في هذه الشركة. لم يُضف مصروف.",
  invalid: "أكمل الحقول المطلوبة وتحقق من التواريخ ومن أن المجموع الفرعي والضريبة يساويان الإجمالي.", currencyMismatch: "يجب أن تطابق عملة الفاتورة عملة الشركة. تحويل العملات غير مُعدّ؛ لم يُسجَّل مصروف.",
  failed: "تعذّر إكمال الإجراء. يرجى المحاولة مجددًا.", setup: "تحتاج معالجة الفواتير إلى تحديث قاعدة البيانات في خدمة الحسابات الحالية. يظل رفع الملفات وسجلها متاحين.", fileType: "الملفات المدعومة: PDF وJPG وJPEG وPNG فقط.", fileTooLarge: "اختر ملفًا غير فارغ لا يتجاوز 10 ميغابايت.",
  working: "يرجى الانتظار…", close: "إغلاق", retry: "المحاولة مجددًا", readonly: "يمكن لدورك عرض الفواتير دون تعديلها.", transaction: "المصروف المرتبط", missingAI: "استخراج البيانات بالذكاء الاصطناعي غير مُعدّ. يمكنك إدخال بيانات الفاتورة يدويًا.", busy: "هذه الفاتورة قيد المعالجة بالفعل. حدّث حالتها قبل بدء استخراج آخر.",
  saved: "تم حفظ المراجعة. لن يُسجَّل أي مصروف حتى تؤكد ذلك.",
};
export const invoiceCopy = { en, ar };
export function invoiceError(error: unknown, t: Copy) {
  const e = error as { message?: string; code?: string };
  if (e?.code === "PGRST202" || e?.code === "42703") return t.setup;
  if (e?.code === "23505" || e?.message?.includes("duplicate_invoice")) return t.duplicate;
  if (e?.message?.includes("currency_mismatch")) return t.currencyMismatch;
  if (e?.message?.includes("already_processing")) return t.busy;
  if (e?.message?.includes("incomplete_review")) return t.invalid;
  if (e?.message === "fileType") return t.fileType;
  if (e?.message === "fileTooLarge") return t.fileTooLarge;
  return t.failed;
}