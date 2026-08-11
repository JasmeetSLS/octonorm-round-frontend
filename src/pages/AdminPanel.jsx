  import { useState, useEffect } from "react";
  import axios from "axios";
  import {
    Settings,
    Clock,
    CheckCircle,
    Plus,
    Zap,
    Upload,
    FileText,
    Loader,
    MapPin,
    Repeat,
    Flag,
    Trash2,
    ChevronUp,
    ChevronDown,
  } from "lucide-react";

  const API_URL = "http://localhost:5000/api";

  export default function AdminPanel() {
    const [uploadedFile, setUploadedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
      movementChart: true,
      holdAreaPre: true,
      preparation: true,
      evaluation: true,
      holdAreaPost: true,
    });

    const [setupData, setSetupData] = useState({
      movementChartFile: null,
      holdAreaPre: false,
      preparationEnabled: true,
      preparationBooths: 5,
      preparationTime: 5,
      preparationReminders: [
        { id: 1, type: "before", minutes: 5 },
        { id: 2, type: "after", minutes: 2 },
      ],
      autoClosePrep: true,
      evaluationRounds: [
        { id: 1, name: "Round 1", time: 10, holdArea: false, reminders: [] },
        { id: 2, name: "Round 2", time: 15, holdArea: false, reminders: [] },
      ],
      holdAreaPost: false,
    });

    useEffect(() => {
      loadSetup();
    }, []);

    const loadSetup = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/setup`);
        if (response.data.success) {
          const data = response.data.data;
          setSetupData((prev) => ({
            ...prev,
            holdAreaPre: data.setup?.hold_area_pre === 1 || false,
            preparationEnabled: data.setup?.preparation_enabled === 1,
            preparationBooths: data.setup?.preparation_booths || 5,
            preparationTime: data.setup?.preparation_time || 5,
            autoClosePrep: data.setup?.auto_close_prep === 1,
            evaluationRounds:
              data.evaluation_rounds?.length > 0
                ? data.evaluation_rounds.map((round) => ({
                    ...round,
                    reminders: round.reminders || [],
                  }))
                : prev.evaluationRounds,
            holdAreaPost: data.setup?.hold_area_post === 1 || false,
          }));
        }
      } catch (error) {
        console.error("Error loading setup:", error);
      } finally {
        setLoading(false);
      }
    };

    const saveAllSetup = async () => {
      setSaving(true);
      try {
        const formData = new FormData();

        const setupConfig = {
          holdAreaPre: setupData.holdAreaPre,
          preparationEnabled: setupData.preparationEnabled,
          preparationBooths: setupData.preparationBooths,
          preparationTime: setupData.preparationTime,
          preparationReminders: setupData.preparationReminders,
          autoClosePrep: setupData.autoClosePrep,
          evaluationRounds: setupData.evaluationRounds,
          holdAreaPost: setupData.holdAreaPost,
        };

        formData.append("setup", JSON.stringify(setupConfig));

        if (uploadedFile) {
          formData.append("file", uploadedFile);
        }

        const response = await axios.post(`${API_URL}/setup`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (response.data.success) {
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
          await loadSetup();
          setUploadedFile(null);
        }
      } catch (error) {
        console.error("Error saving setup:", error);
        alert("Failed to save setup");
      } finally {
        setSaving(false);
      }
    };

    const handleFileUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
        const validTypes = [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "text/csv",
        ];

        if (
          validTypes.includes(file.type) ||
          file.name.endsWith(".xlsx") ||
          file.name.endsWith(".xls") ||
          file.name.endsWith(".csv")
        ) {
          setUploadedFile(file);
          setSetupData((prev) => ({ ...prev, movementChartFile: file }));
        } else {
          alert("Please upload a valid Excel or CSV file");
          e.target.value = null;
        }
      }
    };

    const toggleSection = (section) => {
      setExpandedSections((prev) => ({
        ...prev,
        [section]: !prev[section],
      }));
    };

    // Evaluation round management
    const addEvaluationRound = () => {
      const newId = setupData.evaluationRounds.length + 1;
      setSetupData((prev) => ({
        ...prev,
        evaluationRounds: [
          ...prev.evaluationRounds,
          { id: newId, name: `Round ${newId}`, time: 10, holdArea: false, reminders: [] },
        ],
      }));
    };

    const removeEvaluationRound = (id) => {
      if (setupData.evaluationRounds.length <= 1) {
        alert("At least one evaluation round is required");
        return;
      }
      setSetupData((prev) => ({
        ...prev,
        evaluationRounds: prev.evaluationRounds.filter((round) => round.id !== id),
      }));
    };

    const updateEvaluationRound = (id, field, value) => {
      setSetupData((prev) => ({
        ...prev,
        evaluationRounds: prev.evaluationRounds.map((round) =>
          round.id === id ? { ...round, [field]: value } : round
        ),
      }));
    };

    // Reminders for a specific evaluation round
    const addRoundReminder = (roundId) => {
      setSetupData((prev) => ({
        ...prev,
        evaluationRounds: prev.evaluationRounds.map((round) => {
          if (round.id !== roundId) return round;
          const newId = round.reminders.length + 1;
          return {
            ...round,
            reminders: [...round.reminders, { id: newId, type: "before", minutes: 5 }],
          };
        }),
      }));
    };

    const removeRoundReminder = (roundId, reminderId) => {
      setSetupData((prev) => ({
        ...prev,
        evaluationRounds: prev.evaluationRounds.map((round) => {
          if (round.id !== roundId) return round;
          if (round.reminders.length <= 1) {
            alert("At least one reminder is required per round");
            return round;
          }
          return {
            ...round,
            reminders: round.reminders.filter((r) => r.id !== reminderId),
          };
        }),
      }));
    };

    const updateRoundReminder = (roundId, reminderId, field, value) => {
      setSetupData((prev) => ({
        ...prev,
        evaluationRounds: prev.evaluationRounds.map((round) => {
          if (round.id !== roundId) return round;
          return {
            ...round,
            reminders: round.reminders.map((r) =>
              r.id === reminderId ? { ...r, [field]: value } : r
            ),
          };
        }),
      }));
    };

    // Preparation reminders (without message)
    const addReminder = () => {
      const newId = setupData.preparationReminders.length + 1;
      setSetupData((prev) => ({
        ...prev,
        preparationReminders: [
          ...prev.preparationReminders,
          { id: newId, type: "before", minutes: 5 },
        ],
      }));
    };

    const removeReminder = (id) => {
      if (setupData.preparationReminders.length <= 1) {
        alert("At least one reminder is required");
        return;
      }
      setSetupData((prev) => ({
        ...prev,
        preparationReminders: prev.preparationReminders.filter((reminder) => reminder.id !== id),
      }));
    };

    const updateReminder = (id, field, value) => {
      setSetupData((prev) => ({
        ...prev,
        preparationReminders: prev.preparationReminders.map((reminder) =>
          reminder.id === id ? { ...reminder, [field]: value } : reminder
        ),
      }));
    };

    const ToggleSwitch = ({ enabled, onChange }) => (
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-12 h-7 rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
          enabled
            ? "bg-gradient-to-r from-[#35e08f] to-[#16b567] shadow-[0_6px_16px_-4px_rgba(30,200,120,0.55)]"
            : "bg-[#3a4278] shadow-inner"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    );

    const SectionHeader = ({ title, icon: Icon, section, badge, good }) => (
      <button
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between px-6 py-5 bg-transparent border-none cursor-pointer text-[#c4cbf0] hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[rgba(124,147,255,0.35)] flex items-center justify-center text-[#a9b8ff] shadow-inner">
            <Icon size={16} />
          </div>
          <span className="text-[15.5px] font-bold text-[#f2f4ff]">{title}</span>
          {badge && (
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full ml-1 border ${
                good
                  ? "bg-[rgba(72,214,153,0.15)] text-[#6fe0ac] border-[rgba(72,214,153,0.3)]"
                  : "bg-[rgba(124,147,255,0.18)] text-[#b6c2ff] border-[rgba(124,147,255,0.3)]"
              }`}
            >
              {badge}
            </span>
          )}
        </div>
        {expandedSections[section] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
    );

    if (loading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#1e2a63] via-[#10163a] to-[#070a1c] text-[#c4cbf0] gap-2.5">
          <Loader className="animate-spin" size={30} />
          <p>Loading setup data...</p>
        </div>
      );
    }

    return (
      <div className="font-sans bg-gradient-to-br from-[#1e2a63] via-[#10163a] to-[#070a1c] min-h-screen py-12 px-6 text-[#e9ecf7]">
        <div className="max-w-4xl mx-auto flex flex-col gap-5.5">
          {showSuccess && (
            <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[rgba(38,46,92,0.97)] border border-[rgba(111,224,172,0.35)] shadow-2xl">
              <CheckCircle size={18} color="#6fe0ac" />
              <div>
                <p className="text-sm font-bold text-white m-0">Setup saved</p>
                <p className="text-xs text-[#9aa3d1] mt-0.5">All configurations saved successfully</p>
              </div>
            </div>
          )}

          {/* Header – no save button */}
          <div className="bg-gradient-to-br from-[rgba(38,46,92,0.9)] to-[rgba(22,27,58,0.92)] rounded-2xl border border-white/10 shadow-2xl shadow-black/30 overflow-hidden">
            <div className="flex items-center px-7 py-6">
              <div className="flex items-center gap-4">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#6f8bff] to-[#4457d8] flex items-center justify-center shadow-lg shadow-[rgba(76,98,230,0.7)]">
                  <Settings size={22} color="#fff" />
                </div>
                <div>
                  <h1 className="text-[21px] font-bold text-white m-0 tracking-tight">Assessment setup</h1>
                  <p className="text-[13px] text-[#9aa3d1] mt-0.5">Configure all settings in one place</p>
                </div>
              </div>
            </div>
          </div>

          {/* Movement Chart */}
          <div className="bg-gradient-to-br from-[rgba(38,46,92,0.9)] to-[rgba(22,27,58,0.92)] rounded-2xl border border-white/10 shadow-2xl shadow-black/30 overflow-hidden">
            <SectionHeader
              title="Movement chart"
              icon={Upload}
              section="movementChart"
              badge={uploadedFile ? "Uploaded" : "Required"}
              good={!!uploadedFile}
            />
            {expandedSections.movementChart && (
              <div className="px-7 pb-6 pt-1">
                <div className="flex items-center justify-between gap-5 p-4.5 rounded-2xl mt-3.5 bg-white/5 border border-dashed border-[rgba(140,158,255,0.4)]">
                  <div>
                    <p className="text-sm font-semibold text-[#eef0fb] m-0">Upload Excel file with participant schedules and movements</p>
                    <p className="text-xs text-[#8f97c4] mt-0.5">Supported formats: .xlsx, .xls, .csv</p>
                  </div>
                  <div>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="px-5 py-2.5 rounded-xl cursor-pointer whitespace-nowrap bg-gradient-to-br from-[#303a72] to-[#1e234c] text-[#c3cbff] font-semibold text-sm shadow-lg shadow-black/30 hover:brightness-110 transition inline-block"
                    >
                      Browse
                    </label>
                  </div>
                </div>
                {uploadedFile && (
                  <div className="mt-3.5 flex flex-wrap items-center gap-3 bg-[rgba(124,147,255,0.1)] border border-[rgba(124,147,255,0.25)] rounded-3xl px-4 py-3">
                    <FileText size={18} color="#a9b8ff" />
                    <span className="text-sm text-[#eef0fb] flex-1 min-w-[120px]">{uploadedFile.name}</span>
                    <span className="text-xs text-[#8f97c4]">{(uploadedFile.size / 1024).toFixed(1)} KB</span>
                    <button
                      className="bg-none border-none text-[#f0899a] text-sm font-semibold cursor-pointer hover:underline"
                      onClick={() => {
                        setUploadedFile(null);
                        setSetupData((prev) => ({ ...prev, movementChartFile: null }));
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hold Area (Pre) */}
          <div className="bg-gradient-to-br from-[rgba(38,46,92,0.9)] to-[rgba(22,27,58,0.92)] rounded-2xl border border-white/10 shadow-2xl shadow-black/30 overflow-hidden">
            <SectionHeader
              title="Hold area (pre)"
              icon={MapPin}
              section="holdAreaPre"
              badge={setupData.holdAreaPre ? "Enabled" : "Disabled"}
              good={setupData.holdAreaPre}
            />
            {expandedSections.holdAreaPre && (
              <div className="px-7 pb-6 pt-1">
                <div className="flex items-center justify-between gap-5 mt-4.5">
                  <div>
                    <div className="text-[14.5px] text-[#eef0fb] font-semibold">Enable pre-assessment hold area</div>
                    <div className="text-[12.5px] text-[#8f97c4] mt-0.5">Participants will be held before assessment starts</div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[13.5px] font-bold ${setupData.holdAreaPre ? "text-[#8fe0b5]" : "text-[#6b7398]"}`}>
                      {setupData.holdAreaPre ? "Enabled" : "Disabled"}
                    </span>
                    <ToggleSwitch
                      enabled={setupData.holdAreaPre}
                      onChange={(val) => setSetupData((prev) => ({ ...prev, holdAreaPre: val }))}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preparation Round */}
          <div className="bg-gradient-to-br from-[rgba(38,46,92,0.9)] to-[rgba(22,27,58,0.92)] rounded-2xl border border-white/10 shadow-2xl shadow-black/30 overflow-hidden">
            <SectionHeader
              title="Preparation round"
              icon={Clock}
              section="preparation"
              badge={setupData.preparationEnabled ? "Active" : "Inactive"}
              good={setupData.preparationEnabled}
            />
            {expandedSections.preparation && (
              <div className="px-7 pb-6 pt-1">
                <div className="flex items-center justify-between gap-5 mt-4.5">
                  <span className="text-[14.5px] text-[#eef0fb] font-semibold">Enable preparation stage</span>
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[13.5px] font-bold ${setupData.preparationEnabled ? "text-[#8fe0b5]" : "text-[#6b7398]"}`}>
                      {setupData.preparationEnabled ? "Yes" : "No"}
                    </span>
                    <ToggleSwitch
                      enabled={setupData.preparationEnabled}
                      onChange={(val) => setSetupData((prev) => ({ ...prev, preparationEnabled: val }))}
                    />
                  </div>
                </div>

                {setupData.preparationEnabled && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4.5">
                      <div>
                        <label className="text-[12.5px] text-[#9aa3d1] font-semibold block mb-2">Preparation booths</label>
                        <input
                          type="number"
                          value={setupData.preparationBooths}
                          onChange={(e) =>
                            setSetupData((prev) => ({
                              ...prev,
                              preparationBooths: Math.max(1, parseInt(e.target.value) || 1),
                            }))
                          }
                          className="w-full h-11.5 rounded-3xl border border-white/10 bg-black/25 text-[#f2f4ff] text-sm px-4 outline-none shadow-inner"
                        />
                      </div>
                      <div>
                        <label className="text-[12.5px] text-[#9aa3d1] font-semibold block mb-2">Prep time (minutes)</label>
                        <input
                          type="number"
                          value={setupData.preparationTime}
                          onChange={(e) =>
                            setSetupData((prev) => ({
                              ...prev,
                              preparationTime: Math.max(1, parseInt(e.target.value) || 1),
                            }))
                          }
                          className="w-full h-11.5 rounded-3xl border border-white/10 bg-black/25 text-[#f2f4ff] text-sm px-4 outline-none shadow-inner"
                        />
                      </div>
                    </div>

                    <hr className="border-t border-white/10 my-5" />

                    <div className="flex items-center justify-between gap-5">
                      <span className="text-[14.5px] text-[#eef0fb] font-semibold">Auto close</span>
                      <div className="flex items-center gap-2.5">
                        <span className={`text-[13.5px] font-bold ${setupData.autoClosePrep ? "text-[#8fe0b5]" : "text-[#6b7398]"}`}>
                          {setupData.autoClosePrep ? "Yes" : "No"}
                        </span>
                        <ToggleSwitch
                          enabled={setupData.autoClosePrep}
                          onChange={(val) => setSetupData((prev) => ({ ...prev, autoClosePrep: val }))}
                        />
                      </div>
                    </div>

                    <hr className="border-t border-white/10 my-5" />

                    <div className="flex items-center justify-between gap-5 mt-0">
                      <span className="text-[14.5px] text-[#eef0fb] font-semibold">Reminders</span>
                      <button
                        className="px-4 py-2 rounded-2xl border border-[rgba(124,147,255,0.35)] cursor-pointer bg-[rgba(124,147,255,0.12)] text-[#b6c2ff] font-semibold text-sm flex items-center gap-1.5 hover:bg-[rgba(124,147,255,0.2)] transition"
                        onClick={addReminder}
                      >
                        <Plus size={14} />
                        Add
                      </button>
                    </div>
                    <div className="mt-3.5 flex flex-col gap-3">
                      {setupData.preparationReminders.map((reminder) => (
                        <div
                          key={reminder.id}
                          className="flex items-center gap-2.5 p-3 rounded-3xl bg-[rgba(124,147,255,0.1)] border border-[rgba(124,147,255,0.18)]"
                        >
                          <select
                            value={reminder.type}
                            onChange={(e) => updateReminder(reminder.id, "type", e.target.value)}
                            className="h-10 rounded-2xl border border-white/10 bg-black/25 text-[#f2f4ff] px-3 text-sm outline-none shadow-inner flex-1 min-w-[90px]"
                          >
                            <option value="before">Before</option>
                            <option value="after">After</option>
                          </select>
                          <input
                            type="number"
                            className="w-[80px] h-10 rounded-2xl border border-white/10 bg-black/25 text-[#f2f4ff] px-3 text-sm outline-none shadow-inner"
                            value={reminder.minutes}
                            onChange={(e) =>
                              updateReminder(reminder.id, "minutes", parseInt(e.target.value) || 0)
                            }
                            placeholder="Min"
                          />
                          <button
                            className="w-9.5 h-9.5 rounded-2xl border-none cursor-pointer bg-white/5 text-[#9aa3d1] flex items-center justify-center hover:bg-white/10 transition"
                            aria-label="Remove reminder"
                            onClick={() => removeReminder(reminder.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Evaluation Rounds with reminders per round */}
          <div className="bg-gradient-to-br from-[rgba(38,46,92,0.9)] to-[rgba(22,27,58,0.92)] rounded-2xl border border-white/10 shadow-2xl shadow-black/30 overflow-hidden">
            <SectionHeader
              title="Evaluation rounds"
              icon={Repeat}
              section="evaluation"
              badge={`${setupData.evaluationRounds.length} rounds`}
            />
            {expandedSections.evaluation && (
              <div className="px-7 pb-6 pt-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-3.5">
                  {setupData.evaluationRounds.map((round) => (
                    <div
                      key={round.id}
                      className="rounded-2xl p-5 bg-white/10 border border-white/10 shadow-2xl shadow-black/30"
                    >
                      <div className="flex items-center justify-between mb-3.5">
                        <span className="text-[15px] font-bold text-[#a9b8ff]">Round {round.id}</span>
                        <button
                          className="w-9.5 h-9.5 rounded-2xl border-none cursor-pointer bg-white/5 text-[#9aa3d1] flex items-center justify-center hover:bg-white/10 transition"
                          aria-label="Remove round"
                          onClick={() => removeEvaluationRound(round.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="mb-3.5">
                        <label className="text-[12.5px] text-[#9aa3d1] font-semibold block mb-2">Round name</label>
                        <input
                          type="text"
                          value={round.name}
                          onChange={(e) => updateEvaluationRound(round.id, "name", e.target.value)}
                          placeholder="Round name"
                          className="w-full h-11.5 rounded-3xl border border-white/10 bg-black/25 text-[#f2f4ff] text-sm px-4 outline-none shadow-inner"
                        />
                      </div>
                      <div className="mb-3.5">
                        <label className="text-[12.5px] text-[#9aa3d1] font-semibold block mb-2">Time (minutes)</label>
                        <input
                          type="number"
                          value={round.time}
                          onChange={(e) =>
                            updateEvaluationRound(round.id, "time", parseInt(e.target.value) || 1)
                          }
                          placeholder="Time"
                          className="w-full h-11.5 rounded-3xl border border-white/10 bg-black/25 text-[#f2f4ff] text-sm px-4 outline-none shadow-inner"
                        />
                      </div>
                      <hr className="border-t border-white/10 my-3.5" />
                      <div className="flex items-center justify-between gap-5 mt-0">
                        <span className="text-[13.5px] text-[#eef0fb] font-semibold">Hold area</span>
                        <div className="flex items-center gap-2.5">
                          <span className={`text-[13.5px] font-bold ${round.holdArea ? "text-[#8fe0b5]" : "text-[#6b7398]"}`}>
                            {round.holdArea ? "Yes" : "No"}
                          </span>
                          <ToggleSwitch
                            enabled={round.holdArea}
                            onChange={(val) => updateEvaluationRound(round.id, "holdArea", val)}
                          />
                        </div>
                      </div>

                      {/* Round Reminders */}
                      <hr className="border-t border-white/10 my-3.5" />
                      <div className="flex items-center justify-between gap-5 mt-0">
                        <span className="text-[13.5px] text-[#eef0fb] font-semibold">Reminders</span>
                        <button
                          className="px-3 py-1.5 rounded-xl border border-[rgba(124,147,255,0.35)] cursor-pointer bg-[rgba(124,147,255,0.12)] text-[#b6c2ff] font-semibold text-xs flex items-center gap-1 hover:bg-[rgba(124,147,255,0.2)] transition"
                          onClick={() => addRoundReminder(round.id)}
                        >
                          <Plus size={12} />
                          Add
                        </button>
                      </div>
                      <div className="mt-3 flex flex-col gap-2">
                        {round.reminders.map((reminder) => (
                          <div
                            key={reminder.id}
                            className="flex items-center gap-2 p-2 rounded-xl bg-[rgba(124,147,255,0.08)] border border-[rgba(124,147,255,0.12)]"
                          >
                            <select
                              value={reminder.type}
                              onChange={(e) =>
                                updateRoundReminder(round.id, reminder.id, "type", e.target.value)
                              }
                              className="h-8 rounded-lg border border-white/10 bg-black/25 text-[#f2f4ff] px-2 text-xs outline-none shadow-inner flex-1 min-w-[80px]"
                            >
                              <option value="before">Before</option>
                              <option value="after">After</option>
                            </select>
                            <input
                              type="number"
                              className="w-[70px] h-8 rounded-lg border border-white/10 bg-black/25 text-[#f2f4ff] px-2 text-xs outline-none shadow-inner"
                              value={reminder.minutes}
                              onChange={(e) =>
                                updateRoundReminder(
                                  round.id,
                                  reminder.id,
                                  "minutes",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              placeholder="Min"
                            />
                            <button
                              className="w-7 h-7 rounded-lg border-none cursor-pointer bg-white/5 text-[#9aa3d1] flex items-center justify-center hover:bg-white/10 transition"
                              aria-label="Remove reminder"
                              onClick={() => removeRoundReminder(round.id, reminder.id)}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                        {round.reminders.length === 0 && (
                          <p className="text-xs text-[#6b7398] italic">No reminders set</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="mt-4.5 w-full py-4.5 rounded-2xl text-center border border-dashed border-[rgba(140,158,255,0.35)] bg-transparent text-[#a9b8ff] font-semibold text-sm cursor-pointer flex items-center justify-center gap-2 hover:bg-white/5 transition"
                  onClick={addEvaluationRound}
                >
                  <Plus size={16} />
                  Add evaluation round
                </button>
              </div>
            )}
          </div>

          {/* Hold Area (Post) */}
          <div className="bg-gradient-to-br from-[rgba(38,46,92,0.9)] to-[rgba(22,27,58,0.92)] rounded-2xl border border-white/10 shadow-2xl shadow-black/30 overflow-hidden">
            <SectionHeader
              title="Hold area (post)"
              icon={Flag}
              section="holdAreaPost"
              badge={setupData.holdAreaPost ? "Enabled" : "Disabled"}
              good={setupData.holdAreaPost}
            />
            {expandedSections.holdAreaPost && (
              <div className="px-7 pb-6 pt-1">
                <div className="flex items-center justify-between gap-5 mt-4.5">
                  <div>
                    <div className="text-[14.5px] text-[#eef0fb] font-semibold">Enable post-assessment hold area</div>
                    <div className="text-[12.5px] text-[#8f97c4] mt-0.5">Participants will be held after assessment ends</div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[13.5px] font-bold ${setupData.holdAreaPost ? "text-[#8fe0b5]" : "text-[#6b7398]"}`}>
                      {setupData.holdAreaPost ? "Enabled" : "Disabled"}
                    </span>
                    <ToggleSwitch
                      enabled={setupData.holdAreaPost}
                      onChange={(val) => setSetupData((prev) => ({ ...prev, holdAreaPost: val }))}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer with Launch Assessment button */}
          <div className="bg-gradient-to-br from-[rgba(38,46,92,0.9)] to-[rgba(22,27,58,0.92)] rounded-2xl border border-white/10 shadow-2xl shadow-black/30 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 px-7 py-5">
              <div className="flex flex-wrap items-center gap-5 text-sm text-[#9aa3d1]">
                <span className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${setupData.holdAreaPre ? "bg-[#6f8bff] shadow-[0_0_8px_#6f8bff]" : "bg-[#444b7a]"}`} />
                  Pre-hold
                </span>
                <span className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${setupData.preparationEnabled ? "bg-[#6f8bff] shadow-[0_0_8px_#6f8bff]" : "bg-[#444b7a]"}`} />
                  Prep
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6f8bff] shadow-[0_0_8px_#6f8bff]" />
                  {setupData.evaluationRounds.length} rounds
                </span>
                <span className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${setupData.holdAreaPost ? "bg-[#6f8bff] shadow-[0_0_8px_#6f8bff]" : "bg-[#444b7a]"}`} />
                  Post-hold
                </span>
                {uploadedFile && (
                  <span className="text-[#a9b8ff] font-semibold flex items-center gap-1.5">
                    <FileText size={14} />
                    File uploaded
                  </span>
                )}
              </div>
              <button
                className="px-7 py-3.5 rounded-3xl border-none cursor-pointer bg-gradient-to-br from-[#7c93ff] to-[#4a5be0] text-white font-bold text-[15px] flex items-center gap-2.5 shadow-xl shadow-[rgba(80,100,235,0.65)] hover:brightness-110 transition disabled:opacity-60 disabled:cursor-default"
                onClick={saveAllSetup}
                disabled={saving}
              >
                {saving ? <Loader size={16} className="animate-spin" /> : <Zap size={16} />}
                {saving ? "Saving..." : "Launch assessment"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }