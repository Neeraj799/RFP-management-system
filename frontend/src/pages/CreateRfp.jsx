import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";

const CreateRfpWithPreview = () => {
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  // Editable fields (populated from parsed result)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [warranty, setWarranty] = useState("");
  const [lineItems, setLineItems] = useState([]);

  const handleParse = async () => {
    if (!text.trim()) return toast.error("Paste the RFP text to parse.");

    try {
      setParsing(true);
      const res = await api.post("/ai/parse-rfp", { text });

      const data = res.data?.parsed;
      if (!data) {
        toast.error(res.data?.error || "Parsing failed (no parsed data)");
        return;
      }

      setParsed(data);

      // populate editable fields with safe fallbacks
      setTitle(data?.title ?? "");
      setDescription(data?.description ?? "");
      setBudget(data?.budget ?? "");
      setCurrency(data?.currency ?? "USD");
      setDeliveryDays(data?.deliveryDays ?? "");
      setPaymentTerms(data?.paymentTerms ?? "");
      setWarranty(data?.warranty ?? "");
      setLineItems(
        Array.isArray(data?.lineItems) && data.lineItems.length
          ? data.lineItems.map((li) => ({
              name: li.name ?? "",
              specs: li.specs ?? "",
              qty: li.qty ?? 1,
            }))
          : []
      );

      toast.success("Parsed — review the fields below and click Create.");
    } catch (err) {
      console.error("parse error:", err);
      toast.error(err.response?.data?.error || err.message || "Parse failed");
    } finally {
      setParsing(false);
    }
  };

  // Validation
  const validate = () => {
    if (!title.trim()) {
      toast.error("Title is required.");
      return false;
    }

    if (budget && isNaN(budget)) {
      toast.error("Budget must be numeric.");
      return false;
    }

    for (const li of lineItems) {
      if (!li.name.trim()) {
        toast.error("Line item name required.");
        return false;
      }
      if (!li.qty || li.qty < 1) {
        toast.error("Qty must be at least 1.");
        return false;
      }
    }

    return true;
  };

  // Create using your createRfp API
  const handleCreate = async () => {
    if (!validate()) return;

    // Prepare payload matching server schema
    const safeLineItems = Array.isArray(lineItems)
      ? lineItems.map((li) => ({
          name: li.name || "",
          specs: li.specs || "",
          qty: Number(li.qty || 1),
        }))
      : [];

    const payload = {
      title: title.trim(),
      description: description?.trim() || "",
      budget: budget ? Number(String(budget).replace(/,/g, "")) : null,
      currency: currency || "USD",
      deliveryDays: deliveryDays ? Number(deliveryDays) : null,
      paymentTerms: paymentTerms || null,
      warranty: warranty || null,
      lineItems: safeLineItems,
    };

    try {
      setCreating(true);
      const res = await api.post("/rfp", payload);

      if (!res.data?.success) {
        const error =
          res.data?.error || res.data?.message || "Failed to create RFP";
        toast.error(error);
        return;
      }

      const created = res.data.rfp;
      toast.success(res.data.message || "RFP created successfully");

      if (created) {
        navigate(`/rfp/${created._id}`);
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("create error:", err);
      const error = err.response?.data?.error;
      if (error) {
        toast.error(error) || "Create failed";
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCreateWithoutPreview = async (e) => {
    e.preventDefault();
    if (!text.trim()) return toast.error("Enter RFP text or parse first.");

    try {
      setCreating(true);
      const res = await api.post("/ai/parse-and-create", { text });

      const created = res.data?.rfp;
      if (!created) {
        toast.error(res.data?.error || "Failed to create RFP");
        return;
      }

      toast.success("RFP created");
      navigate(`/rfp/${created._id}`);
    } catch (err) {
      console.error("one-step create error:", err);
      toast.error(err.response?.data?.error || "Create failed");
    } finally {
      setCreating(false);
    }
  };

  // Line item helpers
  const updateLineItem = (idx, patch) =>
    setLineItems((s) =>
      s.map((li, i) => (i === idx ? { ...li, ...patch } : li))
    );
  const addLineItem = () =>
    setLineItems((s) => [...s, { name: "", specs: "", qty: 1 }]);
  const removeLineItem = (idx) =>
    setLineItems((s) => s.filter((_, i) => i !== idx));

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Create RFP</h1>

      <div className="bg-white p-4 rounded shadow mb-4">
        <label className="block text-sm font-medium mb-2">
          Describe procurement (natural language)
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="w-full p-3 rounded border resize-vertical"
          placeholder="Paste full RFP text here..."
        />

        <div className="mt-3 flex gap-2">
          <button
            onClick={handleParse}
            disabled={parsing}
            className="bg-indigo-600 text-white px-4 py-2 rounded"
          >
            {parsing ? "Parsing…" : "Parse & Preview"}
          </button>

          <button
            onClick={handleCreateWithoutPreview}
            disabled={creating}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            {creating ? "Creating…" : "Create without preview"}
          </button>

          <button
            onClick={() => {
              setText("");
              setParsed(null);
            }}
            className="bg-gray-200 px-3 py-2 rounded"
          >
            Clear
          </button>
        </div>
      </div>

      {parsed && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">
            Parsed preview — edit & confirm
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <label>
              <div className="text-xs text-gray-500">Title</div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded p-2"
              />
            </label>

            <label>
              <div className="text-xs text-gray-500">Budget</div>
              <input
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full border rounded p-2"
              />
            </label>

            <label>
              <div className="text-xs text-gray-500">Currency</div>
              <input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full border rounded p-2"
              />
            </label>

            <label>
              <div className="text-xs text-gray-500">Delivery (days)</div>
              <input
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(e.target.value)}
                className="w-full border rounded p-2"
              />
            </label>

            <label className="col-span-2">
              <div className="text-xs text-gray-500">Payment Terms</div>
              <input
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full border rounded p-2"
              />
            </label>

            <label className="col-span-2">
              <div className="text-xs text-gray-500">Warranty</div>
              <input
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                className="w-full border rounded p-2"
              />
            </label>

            <label className="col-span-2">
              <div className="text-xs text-gray-500">Description</div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border rounded p-2"
                rows={4}
              />
            </label>
          </div>

          <div className="mt-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Line items</h3>
              <button
                onClick={addLineItem}
                className="text-sm bg-blue-100 px-2 py-1 rounded"
              >
                Add
              </button>
            </div>

            <div className="mt-2 space-y-2">
              {lineItems.map((li, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    className="col-span-5 border rounded p-2"
                    value={li.name}
                    onChange={(e) =>
                      updateLineItem(idx, { name: e.target.value })
                    }
                    placeholder="Name"
                  />
                  <input
                    className="col-span-5 border rounded p-2"
                    value={li.specs}
                    onChange={(e) =>
                      updateLineItem(idx, { specs: e.target.value })
                    }
                    placeholder="Specs"
                  />
                  <input
                    type="number"
                    className="col-span-1 border rounded p-2"
                    value={li.qty}
                    min={1}
                    onChange={(e) =>
                      updateLineItem(idx, { qty: e.target.value })
                    }
                  />
                  <button
                    className="col-span-1 text-red-600"
                    onClick={() => removeLineItem(idx)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              {creating ? "Creating…" : "Create RFP"}
            </button>

            <button
              onClick={() => {
                setParsed(null);
                toast.info("You can edit the text and parse again.");
              }}
              className="bg-gray-200 px-3 py-2 rounded"
            >
              Edit text / re-parse
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateRfpWithPreview;
