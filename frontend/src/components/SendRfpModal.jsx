import { useState, useEffect } from "react";
import api from "../services/api";
import { toast } from "react-toastify";

const SendRfpModal = ({
  open,
  onClose,
  rfpId,
  existingVendors = [],
  onSent,
}) => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [sending, setSending] = useState(false);

  // Fetch all vendors
  useEffect(() => {
    const loadVendors = async () => {
      try {
        setLoading(true);
        const res = await api.get("/vendors");

        console.log("data", res);

        if (res.data?.success) {
          setVendors(res.data.vendors || []);
        } else {
          toast.error("Failed to load vendors");
        }
      } catch (err) {
        toast.error("Error loading vendors");
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      loadVendors();
      setSelected(new Set()); // RESET STATE ON OPEN
    }
  }, [open]);

  const alreadySentIds = existingVendors.map((v) => v._id);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const handleSend = async () => {
    if (selected.size === 0) {
      toast.info("Select at least one vendor");
      return;
    }

    setSending(true);

    try {
      await api.post(`/rfp/${rfpId}/send`, {
        vendorIds: Array.from(selected),
      });

      toast.success("RFP sent successfully!");
      onSent?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send RFP");
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />

      {/* Modal */}
      <div className="m-auto bg-white p-6 rounded shadow-lg w-full max-w-md relative">
        <h2 className="text-lg font-semibold">Send RFP to Vendors</h2>
        <p className="text-sm text-gray-600 mt-1">
          Select vendors to send this RFP.
        </p>

        {/* Vendor List */}
        <div className="mt-4 max-h-72 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-sm text-gray-500">Loading vendors...</div>
          ) : vendors.length === 0 ? (
            <div className="text-sm text-gray-500">No vendors found.</div>
          ) : (
            vendors.map((vendor) => {
              if (!vendor.email) return null; // IGNORE INVALID VENDORS

              const disabled = alreadySentIds.includes(vendor._id);
              const checked = selected.has(vendor._id);

              return (
                <label
                  key={vendor._id}
                  className={`flex items-center gap-3 p-2 border rounded ${
                    disabled ? "opacity-60 bg-gray-100" : "bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    disabled={disabled || sending}
                    checked={checked}
                    onChange={() => toggleSelect(vendor._id)}
                  />

                  <div>
                    <div className="font-medium">{vendor.name}</div>
                    <div className="text-xs text-gray-500">{vendor.email}</div>
                  </div>

                  {disabled && (
                    <div className="ml-auto text-xs text-gray-500">
                      Already sent
                    </div>
                  )}
                </label>
              );
            })
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded border"
            onClick={onClose}
            disabled={sending}
          >
            Cancel
          </button>

          <button
            className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50"
            onClick={handleSend}
            disabled={sending}
          >
            {sending ? "Sending..." : "Send RFP"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendRfpModal;
