import { useState, useEffect } from "react";
import Select from "react-select";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import api from "../api/api";
import "./Modal.css";

export const MINISTRY_OPTIONS = [
  { value: 1, label: "Altar Ministry" },
  { value: 2, label: "Anointed Hands Sewing Min" },
  { value: 3, label: "Audio Ministry" },
  { value: 4, label: "Call Center" },
  { value: 5, label: "Children’s Choir" },
  { value: 6, label: "Comm Evnagelism Outreach" },
  { value: 7, label: "Cross Current" },
  { value: 8, label: "Culinary Ministry" },
  { value: 9, label: "Dance Ministry" },
  { value: 10, label: "Deacons" },
  { value: 11, label: "Décor Ministry" },
  { value: 12, label: "Economic Empowerment Ministry" },
  { value: 13, label: "Elder" },
  { value: 14, label: "Evangelism/Special Forces" },
  { value: 15, label: "Event Support Team" },
  { value: 16, label: "Flag/Banner Ministry" },
  { value: 17, label: "Gen Salve 2-3 Years" },
  { value: 18, label: "Gen Salve Nursery" },
  { value: 19, label: "Gen Salve Elementary" },
  { value: 20, label: "Gen Salve Middle & High" },
  { value: 21, label: "Genesis 457 Pro Life Ministry" },
  { value: 22, label: "Gen Salve Kid Check" },
  { value: 23, label: "Greeters Ministry" },
  { value: 24, label: "Healing Hands Ministry" },
  { value: 25, label: "Hidden Treasures" },
  { value: 26, label: "In House Pastors & VIP" },
  { value: 27, label: "Information Technology" },
  { value: 28, label: "International Missions Ministry" },
  { value: 29, label: "Intercessory Prayer Ministry" },
  { value: 30, label: "Jail/Prison Ministry" },
  { value: 31, label: "Just Support" },
  { value: 32, label: "Kingdom Overcomers" },
  { value: 33, label: "Lighting Ministry" },
  { value: 34, label: "Maintenance" },
  { value: 35, label: "Marriage Ministry" },
  { value: 36, label: "Media Ministry" },
  { value: 37, label: "Member Relations" },
  { value: 38, label: "Men’s Ministry" },
  { value: 39, label: "Mentor In You" },
  { value: 40, label: "Military Family Support" },
  { value: 41, label: "Mind of Christ" },
  { value: 42, label: "Ministerial Staff" },
  { value: 43, label: "Ministry of the Arts" },
  { value: 44, label: "Choir" },
  { value: 45, label: "My Sisters Keeper" },
  { value: 46, label: "New Believers Ministry" },
  { value: 47, label: "New Member Orientation" },
  { value: 48, label: "Nursing Home" },
  { value: 49, label: "Office Staff" },
  { value: 50, label: "Operation Thunder" },
  { value: 51, label: "Orchestra" },
  { value: 52, label: "Overseers" },
  { value: 53, label: "Parking Ministry" },
  { value: 54, label: "Photography Ministry" },
  { value: 55, label: "Praise & Worship" },
  { value: 56, label: "Rare Jewels" },
  { value: 57, label: "REIGN" },
  { value: 58, label: "Security" },
  { value: 59, label: "Seedtime & Harvest Farm" },
  { value: 60, label: "Singles Ministry" },
  { value: 61, label: "SOF Youth Praise Team" },
  { value: 62, label: "SOS Elementary" },
  { value: 63, label: "SOS High School" },
  { value: 64, label: "SOS Middle School" },
  { value: 65, label: "Special Care" },
  { value: 66, label: "Transformation Bookstore" },
  { value: 67, label: "Transformation Institute" },
  { value: 68, label: "Transportation" },
  { value: 69, label: "Tutoring Ministry" },
  { value: 70, label: "TWI Board" },
  { value: 71, label: "TWI Operations" },
  { value: 72, label: "Ushers" },
  { value: 73, label: "Video" },
  { value: 74, label: "Visitor Follow Up" },
  { value: 75, label: "Warfare Prayer" },
  { value: 76, label: "We Care" },
  { value: 77, label: "Wisdom Warriors" },
  { value: 78, label: "WOW Encounter" },
  { value: 79, label: "WOW Fitness" },
  { value: 80, label: "WOW Human Services" },
  { value: 81, label: "Youth Media" },
  { value: 82, label: "Youth Praise Team" },
];

const GENDER_OPTIONS = [
  { value: "", label: "Select..." },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { scale: 0.9, opacity: 0, y: 40 },
  visible: { scale: 1, opacity: 1, y: 0 },
};

export default function Modal({ open, user, onClose, onSave }) {
  const [draft, setDraft] = useState(user);
  const [selectedMinistries, setSelectedMinistries] = useState([]);
  const [families, setFamilies] = useState([]);
  const [familyQuery, setFamilyQuery] = useState("");
  const [familyId, setFamilyId] = useState(null);
  const [showFamilyDropdown, setShowFamilyDropdown] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState("");
  const [addingNewFamily, setAddingNewFamily] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);

  useEffect(() => {
    setDraft(user);

    let parsed = [];
    if (Array.isArray(user.ministries)) {
      parsed = user.ministries.map((m) =>
        typeof m === "object" && m.value
          ? m.value
          : typeof m === "object" && m.id
          ? m.id
          : m
      );
    } else if (typeof user.ministries === "string") {
      parsed = user.ministries
        .split(",")
        .map((m) => {
          const num = parseInt(m, 10);
          return isNaN(num) ? m.trim() : num;
        })
        .filter(Boolean);
    }
    setSelectedMinistries(
      MINISTRY_OPTIONS.filter(
        (opt) => parsed.includes(opt.value) || parsed.includes(opt.label)
      )
    );

    fetchFamilies();
    setFamilyId(user.family_id || null);
    setFamilyQuery(user.family_name || "");
    if (user.family_id) {
      fetchFamilyMembers(user.family_id);
    } else {
      setFamilyMembers([]);
    }
    setAddingNewFamily(false);
    setNewFamilyName("");
    // eslint-disable-next-line
  }, [user]);

  // --- FAMILY AUTOCOMPLETE LOGIC ---
  const fetchFamilies = async () => {
    try {
      const res = await api.get("/families");
      setFamilies(res.data);
    } catch {
      setFamilies([]);
    }
  };
  const fetchFamilyMembers = async (famId) => {
    if (!famId) return setFamilyMembers([]);
    try {
      const res = await api.get(`/families/${famId}/members`);
      setFamilyMembers(res.data);
    } catch {
      setFamilyMembers([]);
    }
  };
  useEffect(() => {
    if (familyId) fetchFamilyMembers(familyId);
    else setFamilyMembers([]);
  }, [familyId]);

  const filteredFamilies = families.filter((fam) =>
    fam.family_name.toLowerCase().includes((familyQuery || "").toLowerCase())
  );

  const handleAddFamily = async () => {
    if (!newFamilyName.trim()) {
      toast.error("Please enter a family name.");
      return;
    }
    try {
      const res = await api.post("/families", { family_name: newFamilyName });
      setFamilies((prev) => [...prev, res.data]);
      setFamilyId(res.data.id);
      setFamilyQuery(res.data.family_name);
      setDraft((prev) => ({ ...prev, family_id: res.data.id }));
      setAddingNewFamily(false);
      setNewFamilyName("");
      toast.success("Household created!");
    } catch {
      toast.error("Failed to add family.");
    }
  };

  // --- MODAL FIELD HANDLERS ---
  const handleChange = (field, value) =>
    setDraft((prev) => ({ ...prev, [field]: value }));

  // --- ON SAVE ---
  const handleSubmit = (e) => {
    e.preventDefault();

    const ministries =
      selectedMinistries.length > 0
        ? selectedMinistries.map((m) => m.value)
        : user.ministries || [];

    const genderVal =
      draft.gender && draft.gender !== "" ? draft.gender : user.gender;
    const roleVal = draft.role && draft.role !== "" ? draft.role : user.role;

    const payload = {
      ...draft,
      ministries,
      family_id: familyId ? parseInt(familyId) : null,
      role: roleVal,
      gender: genderVal,
      active:
        draft.active === true || draft.active === "true" || draft.active === 1
          ? true
          : false,
      phone: draft.phone, // primary phone as is
      alt_phone: draft.alt_phone, // ** Added alternate phone field here **
    };

    console.log("Submitting update payload:", payload); // Debug log

    onSave(payload);
    toast.success("✅ Changes saved!");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
        >
          <motion.div
            className="modal-card"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="modal-title">Edit User</h3>
            <form onSubmit={handleSubmit} className="modal-form">
              <label>
                First name
                <input
                  value={draft.first_name || ""}
                  onChange={(e) => handleChange("first_name", e.target.value)}
                  required
                />
              </label>
              <label>
                Last name
                <input
                  value={draft.last_name || ""}
                  onChange={(e) => handleChange("last_name", e.target.value)}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={draft.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                />
              </label>

              {/* Phone field */}
              <label>
                Phone
                <input
                  type="text"
                  value={draft.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </label>

              {/* Alt Phone field */}
              <label>
                Alternate Phone
                <input
                  type="text"
                  value={draft.alt_phone || ""}
                  onChange={(e) => handleChange("alt_phone", e.target.value)}
                />
              </label>

              <label>
                Role
                <select
                  value={draft.role || user.role || "member"}
                  onChange={(e) => handleChange("role", e.target.value)}
                >
                  <option value="member">Member</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="elder">Elder</option>
                  <option value="visitor">Visitor</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label>
                Gender
                <select
                  value={draft.gender || user.gender || ""}
                  onChange={(e) => handleChange("gender", e.target.value)}
                >
                  {GENDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select
                  value={
                    draft.active === false || draft.active === "false"
                      ? "false"
                      : "true"
                  }
                  onChange={(e) =>
                    handleChange("active", e.target.value === "true")
                  }
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </label>
              <label>
                Ministries
                <Select
                  isMulti
                  options={MINISTRY_OPTIONS}
                  value={selectedMinistries}
                  onChange={(selected) => setSelectedMinistries(selected || [])}
                  className="ministry-select"
                />
              </label>

              {/* Household / Family Section */}
              <label>Household / Family</label>
              {!addingNewFamily ? (
                <div className="family-autocomplete">
                  <input
                    type="text"
                    placeholder="Type household name"
                    value={familyQuery}
                    readOnly={!!familyId}
                    onChange={(e) => {
                      setFamilyQuery(e.target.value);
                      setShowFamilyDropdown(true);
                      setFamilyId(null);
                      setDraft((prev) => ({ ...prev, family_id: null }));
                    }}
                    onFocus={() => setShowFamilyDropdown(true)}
                    onBlur={() =>
                      setTimeout(() => setShowFamilyDropdown(false), 120)
                    }
                    autoComplete="off"
                  />
                  {familyId && (
                    <button
                      type="button"
                      className="btn-clear-family"
                      title="Clear selection"
                      onClick={() => {
                        setFamilyId(null);
                        setFamilyQuery("");
                        setFamilyMembers([]);
                        setDraft((prev) => ({ ...prev, family_id: null }));
                      }}
                    >
                      ×
                    </button>
                  )}
                  {showFamilyDropdown &&
                    !familyId &&
                    familyQuery.trim().length > 0 && (
                      <div className="family-dropdown">
                        {filteredFamilies.length > 0 &&
                          filteredFamilies.map((fam) => (
                            <div
                              key={fam.id}
                              className="family-option"
                              onMouseDown={() => {
                                setFamilyQuery(fam.family_name);
                                setFamilyId(fam.id);
                                setDraft((prev) => ({
                                  ...prev,
                                  family_id: fam.id,
                                }));
                                setShowFamilyDropdown(false);
                              }}
                            >
                              {fam.family_name}
                            </div>
                          ))}
                        {!filteredFamilies.some(
                          (fam) =>
                            fam.family_name.toLowerCase() ===
                            familyQuery.toLowerCase()
                        ) && (
                          <div
                            className="family-option add-new"
                            onMouseDown={() => {
                              setNewFamilyName(familyQuery.trim());
                              setAddingNewFamily(true);
                              setShowFamilyDropdown(false);
                            }}
                          >
                            + Add New Family: "{familyQuery.trim()}"
                          </div>
                        )}
                      </div>
                    )}
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <input
                    placeholder="Family Name"
                    value={newFamilyName}
                    onChange={(e) => setNewFamilyName(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleAddFamily}
                    className="btn-primary"
                    style={{ width: "90px" }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingNewFamily(false)}
                    className="btn-outline"
                    style={{ width: "90px" }}
                  >
                    Cancel
                  </button>
                </div>
              )}
              {familyId && familyMembers.length > 0 && (
                <div
                  style={{
                    background: "#fafafa",
                    border: "1px solid #eee",
                    marginTop: 10,
                    marginBottom: 12,
                    borderRadius: 6,
                    padding: 12,
                  }}
                >
                  <strong>Current Household Members:</strong>
                  <ul style={{ margin: "8px 0 0 0", paddingLeft: 18 }}>
                    {familyMembers.map((m) => (
                      <li key={m.id}>
                        {m.first_name} {m.last_name}{" "}
                        <span style={{ color: "#888", fontSize: "0.9em" }}>
                          ({m.role})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
