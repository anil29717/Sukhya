import { X } from 'lucide-react';

export type FormField = {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
};

interface FormModalProps {
  open: boolean;
  title: string;
  fields: FormField[];
  values: Record<string, string | boolean>;
  loading?: boolean;
  submitLabel?: string;
  onChange: (name: string, value: string | boolean) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function FormModal({
  open,
  title,
  fields,
  values,
  loading = false,
  submitLabel = 'Save',
  onChange,
  onSubmit,
  onClose,
}: FormModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-[#111827] border border-[#1f2937] rounded-2xl p-6 shadow-2xl my-8">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-lg font-bold text-[#f8fafc]">{title}</h3>
          <button onClick={onClose} className="text-[#64748b] hover:text-[#f8fafc]">
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-4"
        >
          {fields.map((field) => (
            <div key={field.name}>
              <label className="block text-xs font-bold uppercase text-[#64748b] mb-2 tracking-wider">
                {field.label}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  value={String(values[field.name] ?? '')}
                  onChange={(e) => onChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  rows={3}
                  className="w-full bg-[#0b0f19] border border-[#334155] rounded-lg px-4 py-2.5 text-sm text-[#f8fafc] focus:outline-none focus:border-blue-500"
                />
              ) : field.type === 'select' ? (
                <select
                  value={String(values[field.name] ?? '')}
                  onChange={(e) => onChange(field.name, e.target.value)}
                  required={field.required}
                  className="w-full bg-[#0b0f19] border border-[#334155] rounded-lg px-4 py-2.5 text-sm text-[#f8fafc] focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select...</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <label className="flex items-center gap-2 text-sm text-[#f8fafc]">
                  <input
                    type="checkbox"
                    checked={Boolean(values[field.name])}
                    onChange={(e) => onChange(field.name, e.target.checked)}
                    className="rounded"
                  />
                  {field.placeholder ?? 'Enabled'}
                </label>
              ) : (
                <input
                  type={field.type ?? 'text'}
                  value={String(values[field.name] ?? '')}
                  onChange={(e) => onChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  className="w-full bg-[#0b0f19] border border-[#334155] rounded-lg px-4 py-2.5 text-sm text-[#f8fafc] focus:outline-none focus:border-blue-500"
                />
              )}
            </div>
          ))}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#334155] text-[#f8fafc] text-sm hover:bg-[#1e293b]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold disabled:opacity-50"
            >
              {loading ? 'Saving...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
