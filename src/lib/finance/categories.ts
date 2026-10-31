export type CategoryType = "income" | "expense";
export type CategoryLocale = "en" | "ar";

/** English keys are stable references in the existing company-scoped text columns. */
export const financialCategories = [
  { id: "Product Sales", ar: "مبيعات المنتجات", type: "income" },
  { id: "Service Revenue", ar: "إيرادات الخدمات", type: "income" },
  { id: "Project Revenue", ar: "إيرادات المشاريع", type: "income" },
  { id: "Consulting", ar: "الاستشارات", type: "income" },
  { id: "Subscriptions", ar: "الاشتراكات", type: "income" },
  { id: "Other Income", ar: "إيرادات أخرى", type: "income" },
  { id: "Salaries", ar: "الرواتب", type: "expense" },
  { id: "Rent", ar: "الإيجار", type: "expense" },
  { id: "Utilities", ar: "المرافق", type: "expense" },
  { id: "Marketing & Advertising", ar: "التسويق والإعلان", type: "expense" },
  { id: "Purchases & Inventory", ar: "المشتريات والمخزون", type: "expense" },
  { id: "Office Supplies", ar: "اللوازم المكتبية", type: "expense" },
  { id: "Transportation", ar: "النقل", type: "expense" },
  { id: "Software & Technology", ar: "البرمجيات والتكنولوجيا", type: "expense" },
  { id: "Maintenance", ar: "الصيانة", type: "expense" },
  { id: "Taxes & Fees", ar: "الضرائب والرسوم", type: "expense" },
  { id: "Professional Services", ar: "الخدمات المهنية", type: "expense" },
  { id: "Other Expenses", ar: "مصروفات أخرى", type: "expense" },
] as const;

export function categoriesFor(type: CategoryType) { return financialCategories.filter((c) => c.type === type); }
export function categoryLabel(value: string, locale: CategoryLocale) {
  const category = financialCategories.find((c) => c.id === value);
  return category && locale === "ar" ? category.ar : value;
}
export function isStandardCategory(value: string, type: CategoryType) {
  return categoriesFor(type).some((c) => c.id === value);
}
export function validTransactionCategory(value: string, type: CategoryType, initial?: { category: string; type: CategoryType } | null) {
  return isStandardCategory(value, type) || (!!initial && initial.type === type && initial.category === value);
}

export const categoryCopy = {
  en: { choose: "Select category", search: "Search categories…", empty: "No matching categories", invalid: "Select an expense category before recording the expense." },
  ar: { choose: "اختر الفئة", search: "ابحث عن فئة…", empty: "لا توجد فئات مطابقة", invalid: "اختر فئة مصروف قبل تسجيل المصروف." },
};