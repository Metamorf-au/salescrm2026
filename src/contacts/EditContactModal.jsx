import { useState } from "react";
import Modal from "../shared/Modal";
import SuccessScreen from "../shared/SuccessScreen";

export default function EditContactModal({ contact, onSave, onClose }) {
  const [firstName, setFirstName] = useState(contact.firstName || "");
  const [lastName, setLastName] = useState(contact.lastName || "");
  const [company, setCompany] = useState(contact.company || "");
  const [phone, setPhone] = useState(contact.phone || "");
  const [mobile, setMobile] = useState(contact.mobile || "");
  const [email, setEmail] = useState(contact.email || "");
  const [jobTitle, setJobTitle] = useState(contact.jobTitle || "");
  const [industry, setIndustry] = useState(contact.industry || "");
  const [addressLine1, setAddressLine1] = useState(contact.addressLine1 || "");
  const [suburb, setSuburb] = useState(contact.suburb || "");
  const [state, setState] = useState(contact.state || "");
  const [postcode, setPostcode] = useState(contact.postcode || "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!firstName.trim() || !lastName.trim()) return;
    setError("");
    setSaving(true);
    try {
      await onSave(contact.id, { firstName, lastName, company, phone, mobile, email, jobTitle, industry, addressLine1, suburb, state, postcode });
      setSaved(true);
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  return (
    <Modal title="Edit Contact" onClose={onClose}>
      {saved ? (
        <SuccessScreen message="Contact Updated" sub={`${firstName} ${lastName} has been updated.`} />
      ) : (
        <div className="px-6 py-5 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
          {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">First Name *</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="e.g. David"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Last Name *</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="e.g. Harrison"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Company</label>
            <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Apex Building Solutions"
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Job Title</label>
            <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Project Manager"
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 02 9876 5432"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Mobile</label>
              <input type="tel" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="e.g. 0412 345 678"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. david@apexbuilding.com.au"
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Industry</label>
            <input type="text" value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. Construction"
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Address Line 1</label>
            <input type="text" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} placeholder="e.g. 42 George Street"
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Suburb</label>
              <input type="text" value={suburb} onChange={e => setSuburb(e.target.value)} placeholder="e.g. Sydney"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">State</label>
              <select value={state} onChange={e => setState(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent">
                <option value="">Select...</option>
                {["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Postcode</label>
            <input type="text" value={postcode} onChange={e => setPostcode(e.target.value)} placeholder="e.g. 2000" maxLength={4}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent w-32" />
          </div>
          <button onClick={handleSave} disabled={!firstName.trim() || !lastName.trim() || saving}
            className="w-full py-3 rounded-xl font-semibold text-white transition bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </Modal>
  );
}
