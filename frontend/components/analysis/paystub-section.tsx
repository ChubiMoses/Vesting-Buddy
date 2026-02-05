"use client";

import { motion } from "framer-motion";
import { Calendar, DollarSign, TrendingUp, User } from "lucide-react";

interface PaystubData {
  employee_name?: string;
  employer_name?: string;
  pay_period_start?: string;
  pay_period_end?: string;
  pay_date?: string;
  base_pay?: number;
  gross_pay?: number;
  net_pay?: number;
  pre_tax_401k?: number;
  roth_401k?: number;
  hsa_contribution?: number;
  ytd_gross_pay?: number;
  total_taxes?: number;
  total_deductions?: number;
  currency?: string;
  _extraction_confidence?: number;
}

interface PaystubSectionProps {
  data: PaystubData;
}

const DataRow = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number | null | undefined;
  icon?: React.ComponentType<{ className?: string }>;
}) => {
  if (value === null || value === undefined || value === "") return null;

  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon && <Icon className="w-4 h-4" />}
        <span>{label}</span>
      </div>
      <span className="font-semibold font-mono text-foreground">
        {typeof value === "number" ? `$${value.toLocaleString()}` : value}
      </span>
    </div>
  );
};

export function PaystubSection({ data }: PaystubSectionProps) {
  const currency = data.currency || "$";
  const confidence = data._extraction_confidence ?? 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Paystub Details</h3>
          <p className="text-sm text-muted-foreground">
            Extracted compensation data
          </p>
        </div>
        {confidence < 1 && (
          <div className="px-3 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
              {Math.round(confidence * 100)}% confidence
            </span>
          </div>
        )}
      </div>

      {/* Employee Info */}
      {(data.employee_name || data.employer_name) && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
          <DataRow
            label="Employee Name"
            value={data.employee_name}
            icon={User}
          />
          <DataRow
            label="Employer Name"
            value={data.employer_name}
            icon={User}
          />
        </div>
      )}

      {/* Pay Period */}
      {(data.pay_period_start || data.pay_period_end || data.pay_date) && (
        <div className="p-4 rounded-xl bg-card border border-border space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Pay Period
          </h4>
          <DataRow
            label="Period Start"
            value={data.pay_period_start}
            icon={Calendar}
          />
          <DataRow
            label="Period End"
            value={data.pay_period_end}
            icon={Calendar}
          />
          <DataRow label="Pay Date" value={data.pay_date} icon={Calendar} />
        </div>
      )}

      {/* Compensation */}
      <div className="p-4 rounded-xl bg-card border border-border space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Compensation
        </h4>
        <DataRow label="Base Pay" value={data.base_pay} />
        <DataRow label="Gross Pay" value={data.gross_pay} />
        <DataRow label="Net Pay" value={data.net_pay} />
        <DataRow label="YTD Gross Pay" value={data.ytd_gross_pay} />
      </div>

      {/* Benefits & Deductions */}
      <div className="p-4 rounded-xl bg-card border border-border space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Benefits & Deductions
        </h4>
        <DataRow label="Pre-Tax 401(k)" value={data.pre_tax_401k} />
        <DataRow label="Roth 401(k)" value={data.roth_401k} />
        <DataRow label="HSA Contribution" value={data.hsa_contribution} />
        <DataRow label="Total Taxes" value={data.total_taxes} />
        <DataRow label="Total Deductions" value={data.total_deductions} />
      </div>
    </motion.div>
  );
}
