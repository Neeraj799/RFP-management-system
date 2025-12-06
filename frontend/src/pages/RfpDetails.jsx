import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";
import ProposalDetailDrawer from "../components/ProposalModal";
import VendorModal from "../components/VendorModal";
import SendRfpModal from "../components/SendRfpModal";
import CompareVendorsModal from "../components/CompareVendorsModal";

const RfpDetails = () => {
  const { id } = useParams();

  const [rfp, setRfp] = useState(null);
  const [loading, setLoading] = useState(true);

  const [vendorDrawerOpen, setVendorDrawerOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  const [proposals, setProposals] = useState([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);

  const [sendRfpOpen, setSendRfpOpen] = useState(false);

  const [compareOpen, setCompareOpen] = useState(false);

  // UI: how many proposals to preview before "View all"
  const MAX_PREVIEW = 3;
  const [showAllProposals, setShowAllProposals] = useState(false);
  const [showAllVendors, setShowAllVendors] = useState(false);

  // -------------------------------
  // Fetch RFP
  // -------------------------------
  const fetchRfp = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/rfp/${id}`);

      if (res.data?.success) {
        setRfp(res.data.rfp);
      } else {
        toast.error(res.data?.error || "Failed to fetch RFP");
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to fetch RFP";
      toast.error(msg);
      console.error("fetchRfp error:", err);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // Fetch Proposals
  // -------------------------------
  const fetchProposals = async () => {
    try {
      setProposalsLoading(true);
      const res = await api.get(`/rfp/${id}/proposals`);

      if (res.data?.success) {
        setProposals(res.data.proposals || []);
      } else {
        toast.error(res.data?.error || "Failed to fetch proposals");
      }
    } catch (err) {
      const msg =
        err.response?.data?.error || err.message || "Failed to fetch proposals";
      toast.error(msg);
      console.error("fetchProposals error:", err);
    } finally {
      setProposalsLoading(false);
    }
  };

  useEffect(() => {
    fetchRfp();
    fetchProposals();
  }, [id]);

  if (loading) {
    return <div className="p-10 text-center text-gray-600">Loading RFP…</div>;
  }

  // Decide which proposals to render (preview mode vs all)
  const visibleProposals = showAllProposals
    ? proposals
    : proposals.slice(0, MAX_PREVIEW);

  const vendors = Array.isArray(rfp?.sentTo) ? rfp.sentTo : [];
  const visibleVendors = showAllVendors
    ? vendors
    : vendors.slice(0, MAX_PREVIEW);

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-6 my-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{rfp?.title || ""}</h1>
          <p className="text-sm text-gray-700 mt-2">{rfp?.description}</p>

          <div className="text-sm text-gray-500 mt-2">
            Created:{" "}
            {rfp?.createdAt ? new Date(rfp?.createdAt).toLocaleString() : ""}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            className="bg-green-600 text-white px-3 py-2 rounded"
            onClick={() => setSendRfpOpen(true)}
          >
            Send RFP
          </button>

          <button
            className="bg-blue-600 text-white px-3 py-2 rounded"
            onClick={() => setCompareOpen(true)}
          >
            Compare Proposal (AI)
          </button>
        </div>
      </div>

      {/* RFP Facts */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-xs text-gray-500">Budget</div>
          <div className="font-medium">
            {rfp?.budget ? `${rfp?.currency || "USD"} ${rfp?.budget}` : "—"}
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <div className="text-xs text-gray-500">Delivery (days)</div>
          <div className="font-medium">{rfp?.deliveryDays || "—"}</div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <div className="text-xs text-gray-500">Warranty / Payment Terms</div>
          <div className="font-medium">
            {rfp?.warranty || rfp?.paymentTerms || "—"}
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white p-4 rounded shadow col-span-3">
          <h2 className="font-semibold mb-2">Line items</h2>

          {Array.isArray(rfp?.lineItems) && rfp.lineItems.length > 0 ? (
            <ul className="space-y-2">
              {rfp.lineItems.map((li, i) => (
                <li key={i} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{li?.name}</div>
                    {li?.specs && (
                      <div className="text-sm text-gray-600">{li?.specs}</div>
                    )}
                  </div>
                  <div className="text-sm text-gray-700">Qty: {li?.qty}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-500">No line items.</div>
          )}
        </div>

        {/* Vendors (preview or full) */}
        <div className="bg-white p-4 rounded shadow col-span-3">
          <h2 className="font-semibold mb-2">Vendors</h2>

          {vendors.length === 0 ? (
            <div className="text-sm text-gray-500">
              No vendors added to this RFP yet.
            </div>
          ) : (
            <>
              <ul className="space-y-3">
                {visibleVendors.map((v) => (
                  <li
                    key={v._id}
                    className="p-3 bg-gray-50 rounded border flex justify-between items-start"
                  >
                    <div>
                      <div className="font-semibold">{v?.name}</div>
                      <div className="text-sm text-gray-600">{v?.email}</div>
                      {v?.contactPerson && (
                        <div className="text-sm text-gray-600">
                          Contact: {v.contactPerson}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      {v.phone && (
                        <div className="text-sm text-gray-600 mb-2">
                          Phone: {v.phone}
                        </div>
                      )}
                      <button
                        className="bg-indigo-600 text-white px-3 py-1 rounded text-sm"
                        onClick={() => {
                          setSelectedVendor(v);
                          setVendorDrawerOpen(true);
                        }}
                      >
                        View
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Show "View all" / "Show less" toggle when there are more vendors than preview */}
              {vendors.length > MAX_PREVIEW && (
                <div className="mt-3 text-center">
                  <button
                    className="inline-flex items-center gap-2 text-sm text-blue-600 font-medium"
                    onClick={() => setShowAllVendors((s) => !s)}
                  >
                    {showAllVendors ? (
                      <>Show less ▲</>
                    ) : (
                      <>View all {vendors.length} vendors ↓</>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Proposals (preview or full) */}
        <div className="bg-white p-4 rounded shadow col-span-3">
          <h2 className="font-semibold mb-2">Proposals</h2>

          {proposalsLoading ? (
            <div className="p-4">Loading proposals…</div>
          ) : proposals.length === 0 ? (
            <div className="text-sm text-gray-500">
              No proposals received yet.
            </div>
          ) : (
            <>
              <ul className="space-y-3">
                {visibleProposals.map((p) => (
                  <li key={p._id} className="p-3 bg-gray-50 rounded border">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">
                          {p.vendor?.name || "Vendor"}
                        </div>
                        <div className="text-sm text-gray-600">
                          {p.vendor?.email}
                        </div>
                        <div className="text-sm text-gray-600">
                          Received:{" "}
                          {p.createdAt
                            ? new Date(p.createdAt).toLocaleString()
                            : ""}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-semibold">
                          {p.currency}{" "}
                          {p.totalPrice?.toLocaleString?.() ?? p.totalPrice}
                        </div>
                        <div className="text-sm text-gray-600">
                          {p.parsed ? "Parsed" : "Raw"}
                        </div>

                        <button
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm mt-2"
                          onClick={() => {
                            setSelectedProposal(p);
                            setDrawerOpen(true);
                          }}
                        >
                          View
                        </button>
                      </div>
                    </div>

                    {/* Small item preview */}
                    {p.items?.length > 0 && (
                      <div className="mt-3 text-sm">
                        {p.items.slice(0, 3).map((it, idx) => (
                          <div key={idx} className="flex justify-between">
                            <div>
                              {it.name} x{it.qty}
                            </div>
                            <div>{it.total}</div>
                          </div>
                        ))}
                        {p.items.length > 3 && (
                          <div className="text-xs text-gray-500 mt-1">
                            + {p.items.length - 3} more items
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              {/* Show "View all" / "Show less" toggle when there are more proposals than preview */}
              {proposals.length > MAX_PREVIEW && (
                <div className="mt-3 text-center">
                  <button
                    className="inline-flex items-center gap-2 text-sm text-blue-600 font-medium"
                    onClick={() => setShowAllProposals((s) => !s)}
                  >
                    {showAllProposals ? (
                      <>Show less ▲</>
                    ) : (
                      <>View all {proposals.length} proposals ↓</>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Proposal Drawer */}
      <ProposalDetailDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedProposal(null);
        }}
        proposal={selectedProposal}
      />

      {/* Vendor Drawer */}
      <VendorModal
        open={vendorDrawerOpen}
        onClose={() => {
          setVendorDrawerOpen(false);
          setSelectedVendor(null);
        }}
        vendor={selectedVendor}
      />

      <SendRfpModal
        open={sendRfpOpen}
        onClose={() => setSendRfpOpen(false)}
        rfpId={rfp?._id}
        existingVendors={rfp?.sentTo || []}
        onSent={() => {
          fetchRfp();
          fetchProposals();
        }}
      />

      <CompareVendorsModal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        rfpId={id}
        onOpenProposal={(proposalId) => {
          const p = proposals.find((x) => String(x._id) === String(proposalId));
          if (p) {
            setSelectedProposal(p);
            setDrawerOpen(true);
            setCompareOpen(false);
          } else {
            // if proposal not loaded locally, just notify; you could also fetch it
            toast.info(
              "Proposal not loaded locally — refresh proposals to view."
            );
          }
        }}
      />
    </div>
  );
};

export default RfpDetails;
