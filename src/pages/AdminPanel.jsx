// AdminPanel.jsx
import { useState } from "react";
import {
  Settings,
  Users,
  UserCog,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  Save,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Check,
  UserPlus,
  ClipboardList,
  Bell,
  Play,
  Pause,
  Zap,
  Upload,
  FileText,
} from "lucide-react";

export default function AdminPanel() {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    manpower: true,
    preparation: true,
    evaluation: true,
    reminders: true,
  });

  const [setupData, setSetupData] = useState({
    // Manpower
    manpowerCount: 50,
    roleHolderCategories: [
      { id: 1, name: "TC", count: 10 },
      { id: 2, name: "DFM", count: 8 },
      { id: 3, name: "SHE", count: 6 },
      { id: 4, name: "HSE", count: 6 },
      { id: 5, name: "PSC", count: 5 },
      { id: 6, name: "SNE", count: 5 },
      { id: 7, name: "DSE", count: 4 },
      { id: 8, name: "DPH", count: 4 },
      { id: 9, name: "TCI", count: 2 },
    ],
    
    // Preparation
    preparationEnabled: true,
    preparationBooths: 5,
    preparationTimePerCase: 5,
    autoClosePrep: true,
    
    // Evaluation
    evaluationRounds: 2,
    numberOfEvaluators: 5,
    evaluatorToParticipantMapping: true,
    timePerEvaluationRound: 10,
    
    // Reminders
    reminderEnabled: true,
    reminderCount: 3,
    autoSubmit: true,
  });

  const totalSteps = 4;
  const stepTitles = ["Manpower", "Preparation", "Evaluation", "Reminders"];
  const stepIcons = [Users, Clock, UserCog, Bell];

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateCategoryCount = (id, newCount) => {
    setSetupData((prev) => ({
      ...prev,
      roleHolderCategories: prev.roleHolderCategories.map((cat) =>
        cat.id === id ? { ...cat, count: Math.max(0, newCount) } : cat
      ),
    }));
  };

  const addCategory = () => {
    const newId = setupData.roleHolderCategories.length + 1;
    setSetupData((prev) => ({
      ...prev,
      roleHolderCategories: [
        ...prev.roleHolderCategories,
        { id: newId, name: `Role ${newId}`, count: 0 },
      ],
    }));
  };

  const removeCategory = (id) => {
    setSetupData((prev) => ({
      ...prev,
      roleHolderCategories: prev.roleHolderCategories.filter((cat) => cat.id !== id),
    }));
  };

  const totalCount = setupData.roleHolderCategories.reduce((sum, cat) => sum + cat.count, 0);

  const goToStep = (step) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const ToggleSwitch = ({ enabled, onChange, label }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
        enabled ? "bg-emerald-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );

  // Render Step Content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
              <div>
                <span className="text-sm font-medium text-blue-700">Total Count: {totalCount}</span>
                <p className="text-xs text-blue-600">Role Holder Categories: 1-N</p>
              </div>
              <UserPlus className="h-8 w-8 text-blue-400" />
            </div>

            <div className="space-y-1.5">
              <div className="grid grid-cols-12 gap-2 px-2 text-xs font-semibold text-gray-400">
                <div className="col-span-6">Category</div>
                <div className="col-span-4 text-center">Count</div>
                <div className="col-span-2 text-right">Action</div>
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {setupData.roleHolderCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-2 rounded-lg border border-gray-100 p-2 hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <input
                        type="text"
                        value={category.name}
                        onChange={(e) => {
                          setSetupData((prev) => ({
                            ...prev,
                            roleHolderCategories: prev.roleHolderCategories.map((cat) =>
                              cat.id === category.id
                                ? { ...cat, name: e.target.value }
                                : cat
                            ),
                          }));
                        }}
                        className="w-full rounded-lg border border-gray-200 px-3 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          updateCategoryCount(category.id, category.count - 1)
                        }
                        className="rounded-lg border border-gray-200 p-1 hover:bg-gray-100"
                      >
                        <Minus className="h-3 w-3 text-gray-500" />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold">
                        {category.count}
                      </span>
                      <button
                        onClick={() =>
                          updateCategoryCount(category.id, category.count + 1)
                        }
                        className="rounded-lg border border-gray-200 p-1 hover:bg-gray-100"
                      >
                        <Plus className="h-3 w-3 text-gray-500" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeCategory(category.id)}
                      className="rounded-lg p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={addCategory}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-600 transition hover:border-indigo-500 hover:bg-indigo-50"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Enable Preparation Stage</span>
                <ToggleSwitch
                  enabled={setupData.preparationEnabled}
                  onChange={(val) =>
                    setSetupData((prev) => ({ ...prev, preparationEnabled: val }))
                  }
                />
              </div>
              <span className="text-xs text-gray-400">Y/N</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-100 p-3">
                <label className="text-xs text-gray-400">No. of Preparation Booths</label>
                <div className="mt-1">
                  <input
                    type="number"
                    value={setupData.preparationBooths}
                    onChange={(e) =>
                      setSetupData((prev) => ({
                        ...prev,
                        preparationBooths: Math.max(1, parseInt(e.target.value) || 1),
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>
              <div className="rounded-lg border border-gray-100 p-3">
                <label className="text-xs text-gray-400">Prep Time (minutes)</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    value={setupData.preparationTimePerCase}
                    onChange={(e) =>
                      setSetupData((prev) => ({
                        ...prev,
                        preparationTimePerCase: Math.max(1, parseInt(e.target.value) || 1),
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  <span className="text-xs text-gray-400">min</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-100 p-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Auto Close</label>
                <ToggleSwitch
                  enabled={setupData.autoClosePrep}
                  onChange={(val) =>
                    setSetupData((prev) => ({ ...prev, autoClosePrep: val }))
                  }
                />
              </div>
              <span className="text-xs text-gray-400">Y/N</span>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-100 p-3">
                <label className="text-xs text-gray-400">No. of Evaluation Rounds</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    value={setupData.evaluationRounds}
                    onChange={(e) =>
                      setSetupData((prev) => ({
                        ...prev,
                        evaluationRounds: Math.max(1, parseInt(e.target.value) || 1),
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  <span className="text-xs text-gray-400">rounds</span>
                </div>
              </div>
              <div className="rounded-lg border border-gray-100 p-3">
                <label className="text-xs text-gray-400">No. of Evaluators</label>
                <div className="mt-1">
                  <input
                    type="number"
                    value={setupData.numberOfEvaluators}
                    onChange={(e) =>
                      setSetupData((prev) => ({
                        ...prev,
                        numberOfEvaluators: Math.max(1, parseInt(e.target.value) || 1),
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-100 p-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Evaluator to Participant Mapping</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-600">✓ Yes</span>
                  <ToggleSwitch
                    enabled={setupData.evaluatorToParticipantMapping}
                    onChange={(val) =>
                      setSetupData((prev) => ({ ...prev, evaluatorToParticipantMapping: val }))
                    }
                  />
                </div>
              </div>
              <span className="text-xs text-gray-400">Y/N</span>
            </div>

            <div className="rounded-lg border border-gray-100 p-3">
              <label className="text-xs text-gray-400">Time Per Evaluation Round</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  value={setupData.timePerEvaluationRound}
                  onChange={(e) =>
                    setSetupData((prev) => ({
                      ...prev,
                      timePerEvaluationRound: Math.max(1, parseInt(e.target.value) || 1),
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <span className="text-xs text-gray-400">minutes</span>
              </div>
            </div>

            {/* Conditional File Upload - Only show if mapping is enabled */}
            {setupData.evaluatorToParticipantMapping && (
              <div className="rounded-lg border-2 border-dashed border-indigo-300 p-4">
                <div className="flex items-center gap-3">
                  <Upload className="h-5 w-5 text-indigo-500" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700">Upload Mapping List</label>
                    <p className="text-xs text-gray-400">Upload CSV or Excel file with evaluator to participant mapping</p>
                  </div>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                  >
                    Browse
                  </label>
                </div>
                {uploadedFile && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 p-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700">{uploadedFile.name}</span>
                    <span className="text-xs text-green-500">
                      ({(uploadedFile.size / 1024).toFixed(1)} KB)
                    </span>
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="ml-auto text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-3">
            <div className="rounded-lg border border-gray-100 p-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Enable Reminders</label>
                <ToggleSwitch
                  enabled={setupData.reminderEnabled}
                  onChange={(val) =>
                    setSetupData((prev) => ({ ...prev, reminderEnabled: val }))
                  }
                />
              </div>
              <span className="text-xs text-gray-400">Y/N</span>
            </div>

            <div className="rounded-lg border border-gray-100 p-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Reminder Count</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={setupData.reminderCount}
                    onChange={(e) =>
                      setSetupData((prev) => ({
                        ...prev,
                        reminderCount: Math.max(1, parseInt(e.target.value) || 1),
                      }))
                    }
                    className="w-20 rounded-lg border border-gray-200 px-3 py-1 text-center text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  <span className="text-xs text-gray-400">times</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-100 p-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Auto Submit</label>
                <ToggleSwitch
                  enabled={setupData.autoSubmit}
                  onChange={(val) =>
                    setSetupData((prev) => ({ ...prev, autoSubmit: val }))
                  }
                />
              </div>
              <span className="text-xs text-gray-400">Y/N</span>
            </div>

            {/* Summary Card */}
            <div className="mt-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
              <h3 className="text-base font-bold text-center">Setup Summary</h3>
              <div className="mt-3 grid grid-cols-4 gap-2 text-sm">
                <div className="text-center">
                  <p className="text-white/70 text-xs">Total Participants</p>
                  <p className="text-lg font-bold">{totalCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-white/70 text-xs">Categories</p>
                  <p className="text-lg font-bold">{setupData.roleHolderCategories.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-white/70 text-xs">Prep Booths</p>
                  <p className="text-lg font-bold">{setupData.preparationBooths}</p>
                </div>
                <div className="text-center">
                  <p className="text-white/70 text-xs">Evaluators</p>
                  <p className="text-lg font-bold">{setupData.numberOfEvaluators}</p>
                </div>
              </div>
              {uploadedFile && (
                <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-white/20 p-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{uploadedFile.name}</span>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <div className="h-full w-full flex flex-col p-4">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between rounded-2xl bg-white px-6 py-4 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-indigo-600 p-2.5">
              <Settings className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Setup Panel</h1>
              <p className="text-xs text-gray-500">Configure assessment workflow settings</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-200">
              <RefreshCw className="h-3.5 w-3.5" />
              Reset
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700">
              <Save className="h-3.5 w-3.5" />
              Save Changes
            </button>
          </div>
        </div>

        {/* Stepper - Centered with lines */}
        <div className="flex-shrink-0 mt-6 px-8">
          <div className="flex items-center justify-center">
            {stepTitles.map((title, index) => {
              const stepNumber = index + 1;
              const isActive = currentStep === stepNumber;
              const isCompleted = currentStep > stepNumber;
              const Icon = stepIcons[index];

              return (
                <div key={stepNumber} className="flex items-center">
                  <button
                    onClick={() => goToStep(stepNumber)}
                    className="flex flex-col items-center transition"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
                        isActive
                          ? "border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                          : isCompleted
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-gray-300 bg-white text-gray-400"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span
                      className={`mt-1 text-[10px] font-medium whitespace-nowrap ${
                        isActive ? "text-indigo-600" : "text-gray-400"
                      }`}
                    >
                      {title}
                    </span>
                  </button>
                  {stepNumber < totalSteps && (
                    <div className="w-16 mx-1">
                      <div
                        className={`h-0.5 transition ${
                          currentStep > stepNumber ? "bg-emerald-500" : "bg-gray-300"
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Card */}
        <div className="flex-1 mt-4 overflow-hidden rounded-2xl bg-white shadow-lg flex flex-col min-h-0">
          <div className="flex-shrink-0 border-b border-gray-100 px-6 py-3">
            <h2 className="text-base font-semibold text-gray-800">
              Step {currentStep}: {stepTitles[currentStep - 1]}
            </h2>
            <p className="text-xs text-gray-500">
              Configure {stepTitles[currentStep - 1].toLowerCase()} settings
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex-shrink-0 border-t border-gray-100 px-6 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                  currentStep === 1
                    ? "cursor-not-allowed bg-gray-100 text-gray-400"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </button>

              {currentStep === totalSteps ? (
                <button className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700">
                  <Zap className="h-4 w-4" />
                  Launch Assessment
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex-shrink-0 mt-3 flex items-center justify-center gap-2">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`h-1 w-8 rounded-full transition ${
                currentStep > index ? "bg-indigo-600" : "bg-gray-200"
              }`}
            />
          ))}
          <span className="ml-2 text-[10px] text-gray-400">
            {currentStep} / {totalSteps}
          </span>
        </div>
      </div>
    </div>
  );
}