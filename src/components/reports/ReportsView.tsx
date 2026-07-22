"use client";

import { useState } from "react";

const PERIODS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

interface ReportData {
  totalSales: number;
  totalOrders: number;
  averageOrder: number;
  netSales: number;
  vatCollected: number;
  paymentBreakdown: { method: string; total: number; count: number }[];
  topProducts: { name: string; qty: number; revenue: number }[];
  periodStart: string;
  periodEnd: string;
}

const EMPTY_REPORT: ReportData = {
  totalSales: 0,
  totalOrders: 0,
  averageOrder: 0,
  netSales: 0,
  vatCollected: 0,
  paymentBreakdown: [],
  topProducts: [],
  periodStart: "",
  periodEnd: "",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(n: number) {
  return "\u20B1" + n.toFixed(2);
}

export default function ReportsView() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData>(EMPTY_REPORT);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState(false);

  async function generateReport() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/reports?period=${period}&date=${date}`
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate report");
      }
      const data = await res.json();
      setReport(data);
      setGenerated(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function downloadPDF() {
    try {
      const res = await fetch(
        `/api/reports?period=${period}&date=${date}&format=pdf`
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to download PDF");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ogalley-report-${period}-${date}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    }
  }

  return (
    <div className="flex-1 p-6 overflow-auto bg-gray-950">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-gray-400 text-sm mt-1">
            Generate and download sales reports
          </p>
        </div>

        {/* Controls */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Period selector */}
            <div className="flex bg-gray-800 rounded-lg p-1">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value as typeof period)}
                  className={
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all " +
                    (period === p.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600")
                  }
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Date picker */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Date:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={generateReport}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:text-gray-400 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                {loading ? "Generating..." : "Generate"}
              </button>
              {generated && (
                <button
                  onClick={downloadPDF}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Download PDF
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Report Content */}
        {generated && !error && (
          <div className="space-y-4">
            {/* Period Label */}
            <div className="text-center text-gray-400 text-xs">
              {formatDate(report.periodStart)} &mdash; {formatDate(report.periodEnd)}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                label="Total Sales"
                value={formatCurrency(report.totalSales)}
                color="blue"
              />
              <StatCard
                label="Total Orders"
                value={String(report.totalOrders)}
                color="green"
              />
              <StatCard
                label="Average Order"
                value={formatCurrency(report.averageOrder)}
                color="purple"
              />
              <StatCard
                label="VAT Collected"
                value={formatCurrency(report.vatCollected)}
                color="amber"
              />
            </div>

            {/* Net Sales / VAT Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Sales Breakdown */}
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Sales Breakdown
                </h3>
                <div className="space-y-2">
                  <Row
                    label="Gross Sales"
                    value={formatCurrency(report.totalSales)}
                  />
                  <Row
                    label="VAT (12% incl.)"
                    value={formatCurrency(report.vatCollected)}
                    className="text-amber-400"
                  />
                  <div className="border-t border-gray-700 pt-2">
                    <Row
                      label="Net Sales"
                      value={formatCurrency(report.netSales)}
                      bold
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Breakdown */}
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Payment Methods
                </h3>
                {report.paymentBreakdown.length === 0 ? (
                  <p className="text-gray-500 text-xs">No payment data</p>
                ) : (
                  <div className="space-y-2">
                    {report.paymentBreakdown.map((pm) => (
                      <Row
                        key={pm.method}
                        label={pm.method}
                        value={formatCurrency(pm.total) + " (" + pm.count + ")"}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-white mb-3">
                Top Products
              </h3>
              {report.topProducts.length === 0 ? (
                <p className="text-gray-500 text-xs">No product data</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 text-xs border-b border-gray-800">
                        <th className="text-left py-2 font-medium">#</th>
                        <th className="text-left py-2 font-medium">Product</th>
                        <th className="text-right py-2 font-medium">Qty Sold</th>
                        <th className="text-right py-2 font-medium">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.topProducts.map((prod, i) => (
                        <tr
                          key={prod.name}
                          className="border-b border-gray-800/50"
                        >
                          <td className="py-2 text-gray-500">{i + 1}</td>
                          <td className="py-2 text-white">{prod.name}</td>
                          <td className="py-2 text-right text-gray-300">
                            {prod.qty}
                          </td>
                          <td className="py-2 text-right text-white font-medium">
                            {formatCurrency(prod.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!generated && !error && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-4xl mb-3">�\udcca</p>
            <p>Select a period and date, then click Generate</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  const borderMap: Record<string, string> = {
    blue: "border-blue-700",
    green: "border-green-700",
    purple: "border-purple-700",
    amber: "border-amber-700",
  };
  const textMap: Record<string, string> = {
    blue: "text-blue-400",
    green: "text-green-400",
    purple: "text-purple-400",
    amber: "text-amber-400",
  };
  return (
    <div
      className={
        "bg-gray-900 rounded-xl p-4 border " + (borderMap[color] || "border-gray-700")
      }
    >
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={"text-lg font-bold " + (textMap[color] || "text-white")}>
        {value}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  className,
}: {
  label: string;
  value: string;
  bold?: boolean;
  className?: string;
}) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className={bold ? "text-white font-medium" : "text-gray-400"}>
        {label}
      </span>
      <span
        className={
          (bold ? "text-white font-semibold" : "text-gray-200") +
          (className ? " " + className : "")
        }
      >
        {value}
      </span>
    </div>
  );
}