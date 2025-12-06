import React from "react";

const VendorModal = ({ open, onClose, vendor }) => {
  if (!open || !vendor) return null;

  return (
    <div className="fixed inset-0 z-50 flex" aria-modal="true" role="dialog">
      <div
        className="fixed inset-0 bg-transparent"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="ml-auto w-full max-w-2xl bg-white h-full shadow-xl overflow-auto p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">{vendor.name}</h2>
            <div className="text-sm text-gray-600">{vendor.email}</div>
            {vendor.contactPerson && (
              <div className="text-sm text-gray-600">
                Contact: {vendor.contactPerson}
              </div>
            )}
          </div>

          <div>
            <button
              className="text-gray-600 px-3 py-1"
              onClick={onClose}
              aria-label="Close vendor"
            >
              Close
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-xs text-gray-500">Phone</div>
            <div className="font-medium">{vendor.phone || "—"}</div>
          </div>

          <div className="bg-gray-50 p-4 rounded">
            <div className="text-xs text-gray-500">Status</div>
            <div className="font-medium">{vendor.status || "—"}</div>
          </div>
        </div>

        {vendor.address && (
          <div className="mt-4 bg-white p-4 rounded border">
            <div className="text-xs text-gray-500">Address</div>
            <div className="text-sm text-gray-700">{vendor.address}</div>
          </div>
        )}

        {vendor.notes && (
          <div className="mt-4 bg-white p-4 rounded border">
            <div className="text-xs text-gray-500">Notes</div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">
              {vendor.notes}
            </div>
          </div>
        )}

        {/* Contact / actions */}
        <div className="mt-6 flex gap-3">
          {vendor.email && (
            <a
              href={`mailto:${vendor.email}`}
              className="inline-block px-3 py-2 bg-blue-600 text-white rounded"
            >
              Email
            </a>
          )}

          {vendor.phone && (
            <a
              href={`tel:${vendor.phone}`}
              className="inline-block px-3 py-2 bg-green-600 text-white rounded"
            >
              Call
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorModal;
