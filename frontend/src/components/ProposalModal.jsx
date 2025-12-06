import React from "react";

const ProposalDetailDrawer = ({ open, onClose, proposal }) => {
  if (!open || !proposal) return null;

  return (
    <div className="fixed inset-0 z-40 flex" aria-modal="true" role="dialog">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <aside
        className="ml-auto w-full max-w-2xl bg-white h-screen shadow-xl overflow-y-auto p-6 z-50"
        role="document"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Proposal — {proposal.vendor?.name || "Vendor"}
            </h2>
            <div className="text-sm text-gray-600">
              {proposal.vendor?.email} • Received:{" "}
              {proposal.createdAt
                ? new Date(proposal.createdAt).toLocaleString()
                : ""}
            </div>
          </div>

          <div>
            <button
              className="text-gray-600 px-3 py-1"
              onClick={onClose}
              aria-label="Close proposal"
            >
              Close
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-xs text-gray-500">Status</div>
            <div className="font-medium">
              {proposal.parsed ? "Parsed" : "Raw"}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded">
            <div className="text-xs text-gray-500">Total</div>
            <div className="font-medium">
              {proposal.currency}{" "}
              {proposal.totalPrice?.toLocaleString?.() ?? proposal.totalPrice}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded border">
            <div className="text-xs text-gray-500">Payment Terms</div>
            <div className="font-medium">{proposal.paymentTerms || "—"}</div>
          </div>

          <div className="bg-white p-4 rounded border">
            <div className="text-xs text-gray-500">Warranty</div>
            <div className="font-medium">{proposal.warranty || "—"}</div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-2">Items</h3>
          {Array.isArray(proposal.items) && proposal.items.length > 0 ? (
            <div className="space-y-2">
              {proposal.items.map((it, i) => (
                <div
                  key={i}
                  className="flex justify-between items-start p-2 border rounded"
                >
                  <div>
                    <div className="font-medium">{it.name}</div>
                    {it.specs && (
                      <div className="text-sm text-gray-600">{it.specs}</div>
                    )}
                    <div className="text-xs text-gray-500">
                      Qty: {it.qty ?? 1}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {it.total ?? it.unitTotal ?? "—"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {it.unitPrice ? `Unit: ${it.unitPrice}` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No items parsed.</div>
          )}
        </div>

        {proposal.rawText && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Raw email / extracted text</h3>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-3 rounded">
              {proposal.rawText}
            </pre>
          </div>
        )}

        <div className="mt-6">
          <h3 className="font-semibold mb-2">Attachments</h3>
          {Array.isArray(proposal.attachments) &&
          proposal.attachments.length > 0 ? (
            <ul>
              {proposal.attachments.map((a, i) => (
                <li key={i} className="text-sm">
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                  >
                    {a.filename || a.name || `attachment-${i + 1}`}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-500">No attachments.</div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default ProposalDetailDrawer;
