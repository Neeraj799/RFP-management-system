import React, { useEffect, useState } from "react";
import api from "../services/api";
import { toast } from "react-toastify";

/**
 * Defensive CompareVendorsModal
 * Accepts backend shapes like:
 * - { summary, comparisonTable, recommendation }
 * - { comparisons, recommendedProposalId, explain }
 *
 * Props:
 * - open, onClose, rfpId
 * - onOpenProposal(proposalId) optional callback to open a proposal in parent
 */
const CompareVendorsModal = ({
  open,
  onClose,
  rfpId,
  onOpenProposal,
  proposals = [],
}) => {
  const [loading, setLoading] = useState(false);
  const [raw, setRaw] = useState(null);

  useEffect(() => {
    if (open) fetchComparison();
    else setRaw(null);
    // eslint-disable-next-line
  }, [open]);

  const fetchComparison = async () => {
    if (!rfpId) return;
    setLoading(true);
    try {
      const res = await api.get(`/rfp/${rfpId}/compare`);
      if (!res.data?.success) {
        toast.error(res.data?.error || "Compare failed");
        setLoading(false);
        return;
      }
      // Keep entire response for debugging / rendering
      console.debug("Compare vendors response:", res.data);
      setRaw(res.data);
    } catch (err) {
      console.error("compare fetch error:", err);
      toast.error(err.response?.data?.error || err.message || "Compare failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  // Normalize different possible shapes
  const summary = raw?.summary ?? raw?.explain ?? raw?.aiExplanation ?? "";
  const table =
    raw?.comparisonTable ??
    raw?.comparisons ??
    raw?.result?.comparisons ??
    raw?.data ??
    [];
  const recommendationObj =
    raw?.recommendation ??
    raw?.result?.recommendation ??
    raw?.recommended ??
    null;

  // sort by score descending if score exists
  const sorted = Array.isArray(table)
    ? table.slice().sort((a, b) => {
        const sa = Number(a.score ?? a.totalScore ?? -Infinity);
        const sb = Number(b.score ?? b.totalScore ?? -Infinity);
        return sb - sa;
      })
    : [];

  // helper to try find proposal id by vendor or price (best-effort)
  const findProposalId = (row) => {
    // If row already includes proposalId or id, use that:
    const directId = row.proposalId || row.id || row._id;
    if (directId) return directId;

    // Try match by vendor name
    if (row.vendor && Array.isArray(proposals) && proposals.length) {
      const byVendor = proposals.find((p) => {
        const vName = p.vendor?.name || p.vendor;
        return (
          vName &&
          String(vName).toLowerCase().includes(String(row.vendor).toLowerCase())
        );
      });
      if (byVendor) return byVendor._id;
    }

    // Try match by totalPrice
    if (row.totalPrice != null && Array.isArray(proposals)) {
      const byPrice = proposals.find(
        (p) => Number(p.totalPrice) === Number(row.totalPrice)
      );
      if (byPrice) return byPrice._id;
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-50 w-full max-w-5xl bg-white rounded shadow p-6 max-h-[85vh] overflow-auto">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">Compare vendors (AI)</h3>
          <div className="flex gap-2">
            <button className="text-sm text-gray-600" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        {loading && <div className="mt-6">Comparing vendors…</div>}

        {!loading && !raw && (
          <div className="mt-6 text-sm text-gray-600">No result yet.</div>
        )}

        {!loading && raw && (
          <>
            {summary && (
              <div className="mt-4 p-3 bg-gray-50 rounded text-sm whitespace-pre-wrap">
                <strong>Summary</strong>
                <div className="mt-2">{summary}</div>
              </div>
            )}

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="pb-2">Vendor</th>
                    <th className="pb-2">Price</th>
                    <th className="pb-2">Delivery (days)</th>
                    <th className="pb-2">Warranty</th>
                    <th className="pb-2">Payment</th>
                    <th className="pb-2">Score</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {sorted.map((row, idx) => {
                    const vendor =
                      row.vendor ??
                      row.vendorName ??
                      row.vendor_id ??
                      `Vendor ${idx + 1}`;
                    const price =
                      row.totalPrice ?? row.price ?? row.amount ?? "—";
                    const delivery = row.deliveryDays ?? row.delivery ?? "—";
                    const warranty = row.warranty ?? "—";
                    const payment =
                      row.paymentTerms ??
                      row.payment ??
                      row.paymentTerms ??
                      "—";
                    const score =
                      row.score ?? row.totalScore ?? row.rank ?? "—";

                    const proposalId = findProposalId(row);
                    const isRecommended =
                      (recommendationObj &&
                        (recommendationObj.vendor === vendor ||
                          recommendationObj.vendor === row.vendor)) ||
                      (recommendationObj &&
                        recommendationObj.proposalId &&
                        String(recommendationObj.proposalId) ===
                          String(proposalId));

                    return (
                      <tr
                        key={idx}
                        className={isRecommended ? "bg-green-50" : ""}
                      >
                        <td className="py-2">{vendor}</td>
                        <td>{price}</td>
                        <td>{delivery}</td>
                        <td>{warranty}</td>
                        <td>{payment}</td>
                        <td className="font-semibold">{score}</td>
                        <td>
                          <div className="flex gap-2">
                            {proposalId ? (
                              <button
                                onClick={() => {
                                  if (onOpenProposal)
                                    onOpenProposal(proposalId);
                                }}
                                className="text-blue-600 text-sm"
                              >
                                View proposal
                              </button>
                            ) : (
                              <span className="text-xs text-gray-500">
                                No proposal link
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {recommendationObj && (
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <h4 className="font-semibold">Recommendation</h4>
                <div className="text-sm mt-2">
                  <strong>
                    {recommendationObj.vendor ??
                      recommendationObj.vendorName ??
                      ""}
                  </strong>
                </div>
                {recommendationObj.reason && (
                  <div className="mt-1 text-sm">{recommendationObj.reason}</div>
                )}
              </div>
            )}

            {/* raw debug */}
            <details className="mt-4 text-xs text-gray-500">
              <summary>Raw response (debug)</summary>
              <pre className="whitespace-pre-wrap text-xs p-2 bg-gray-100 rounded mt-2">
                {JSON.stringify(raw, null, 2)}
              </pre>
            </details>
          </>
        )}
      </div>
    </div>
  );
};

export default CompareVendorsModal;
