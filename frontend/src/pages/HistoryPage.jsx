import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  ArrowRight,
  FileText,
  Calendar,
  Package,
  Layers,
  Sparkles,
  RefreshCw,
  Plus
} from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';

const CATEGORIES = [
  'ALL',
  'Food & Confectionery',
  'Cosmetics & Personal Care',
  'Electronics & Hardware',
  'Pharmaceuticals & OTC',
  'Household & Detergents',
];

export default function HistoryPage() {
  const [inspections, setInspections] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.history.list({
        search,
        status: statusFilter,
        category: categoryFilter,
      });
      setInspections(data);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [search, statusFilter, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100">Inspection History & Audit Logs</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-medium">
              {inspections.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete archive of packaged commodities assessed under Legal Metrology Rules, 2011
          </p>
        </div>

        <Link
          to="/inspection/new"
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-2 self-start sm:self-auto transition-all"
        >
          <Plus size={16} />
          <span>New Inspection</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        {/* Search Input */}
        <div className="md:col-span-6 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Product Name, Inspection ID, or Ref..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-slate-100 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="md:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLIANT">Compliant Only</option>
            <option value="NON_COMPLIANT">Non-Compliant Only</option>
            <option value="NEEDS_REVIEW">Needs Review Only</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="md:col-span-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'ALL' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* History Table / Records */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw size={24} className="text-blue-500 animate-spin" />
              <p className="text-xs text-slate-400 font-mono">Loading history records...</p>
            </div>
          </div>
        ) : inspections.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package size={40} className="text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">No Inspection Records Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No matching packaged commodities were found for the selected criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Commodity / Sample</th>
                  <th className="py-3.5 px-4">Inspection ID / Ref</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-3 text-center">Confidence</th>
                  <th className="py-3.5 px-3 text-center">Violations</th>
                  <th className="py-3.5 px-4">Date & Officer</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {inspections.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Commodity preview */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-700 bg-slate-950 shrink-0"
                        />
                        <div>
                          <p className="font-semibold text-slate-100 line-clamp-1">{item.productName}</p>
                          <p className="text-[11px] text-slate-400">{item.category}</p>
                        </div>
                      </div>
                    </td>

                    {/* IDs */}
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <p className="text-slate-200 font-semibold">{item.id}</p>
                      <p className="text-slate-400 text-[10px]">{item.referenceId}</p>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-3 text-center">
                      <StatusBadge status={item.status} size="sm" />
                    </td>

                    {/* Confidence */}
                    <td className="py-3.5 px-3 text-center font-mono text-slate-300">
                      {item.confidenceScore}%
                    </td>

                    {/* Violations count */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                          item.violations.length > 0
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {item.violations.length}
                      </span>
                    </td>

                    {/* Date & Officer */}
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      <p className="text-slate-300">{new Date(item.createdAt).toLocaleDateString()}</p>
                      <p className="text-[10px] text-slate-400">{item.officer || 'Inspector'}</p>
                    </td>

                    {/* Action Links */}
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/inspection/${item.id}/results`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-colors"
                      >
                        <span>View Dossier</span>
                        <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
