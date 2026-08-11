// DigitalFlow.jsx
import { useState, useEffect, useRef } from "react";
import {
  Clock,
  Gamepad2,
  Hourglass,
  Settings,
  ClipboardList,
  Flag,
  Users,
  X,
  UserCog,
  Monitor,
  CheckSquare,
  Square,
  MousePointerClick,
} from "lucide-react";

export default function DigitalFlow() {
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupAction, setPopupAction] = useState("");
  const [showChangeTrainer, setShowChangeTrainer] = useState(false);
  const [selectedTrainerForParticipant, setSelectedTrainerForParticipant] = useState(null);

  // Drag & drop state
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverRoomId, setDragOverRoomId] = useState(null);
  const dragOccurredRef = useRef(false);

  // Multi-select state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkTrainer, setShowBulkTrainer] = useState(false);

  // Octonorm room names - no colors
  const octonormRooms = [
    { id: 1, name: "Octonorm 1" },
    { id: 2, name: "Octonorm 2" },
    { id: 3, name: "Octonorm 3" },
    { id: 4, name: "Octonorm 4" },
    { id: 5, name: "Octonorm 5" },
    { id: 6, name: "Octonorm 6" },
    { id: 7, name: "Octonorm 7" },
    { id: 8, name: "Octonorm 8" },
    { id: 9, name: "Octonorm 9" },
    { id: 10, name: "Octonorm 10" },
  ];

  // Trainer/Evaluator names with only background colors
  const trainerColors = {
    "Abhisheks": { bg: "bg-red-500" },
    "Pooja Bora": { bg: "bg-blue-500" },
    "Hitendra": { bg: "bg-green-500" },
    "Manjira": { bg: "bg-yellow-500" },
    "Amit": { bg: "bg-purple-500" },
    "Sagar": { bg: "bg-pink-500" },
    "Vinendra": { bg: "bg-indigo-500" },
    "Balshree": { bg: "bg-teal-500" },
    "Madhu TV": { bg: "bg-orange-500" },
    "Mithir": { bg: "bg-cyan-500" },
  };

  const trainerNames = [
    "Abhisheks", "Pooja Bora", "Hitendra", "Manjira", "Amit",
    "Sagar", "Vinendra", "Balshree", "Madhu TV", "Mithir"
  ];

// Participant folder names with their assigned trainers (based on your list)
const participantData = [
  { folder: "Aiswarya_Vijayan_18655", trainer: "Abhisheks" },
  { folder: "Anson_Daniel_90226540", trainer: "Pooja Bora" },
  { folder: "Athi_Raja_503666", trainer: "Hitendra" },
  { folder: "D_Shanker_Naik_503825", trainer: "Manjira" },
  { folder: "Hanuma_Ram_503709", trainer: "Amit" },
  { folder: "Lavanya_Sen_18642", trainer: "Sagar" },
  { folder: "Mari_Prakash_503816", trainer: "Vinendra" },
  { folder: "Nisha_Patel_16362", trainer: "Balshree" },
  { folder: "Prasanth_Josi_16367", trainer: "Madhu TV" },
  { folder: "Ramachandran_S_90178761", trainer: "Mithir" },
  { folder: "Samarth___90163255", trainer: "Abhisheks" },
  { folder: "Sravan_Reddy_18349", trainer: "Pooja Bora" },
  { folder: "Vallabhaneni_Kumar_16158", trainer: "Hitendra" },
  { folder: "Akash_B_18087", trainer: "Manjira" },
  { folder: "Arun_K_Narayan_19225", trainer: "Amit" },
  { folder: "Barath_Selvakumar_90236226", trainer: "Sagar" },
  { folder: "DHANASEALAN_L_18247", trainer: "Vinendra" },
  { folder: "K_JAGADEESHWARRREDDY_16401", trainer: "Balshree" },
  { folder: "Mahesh_Bavirisetti_13961", trainer: "Madhu TV" },
  { folder: "Mohamed_Anishkhan_16245", trainer: "Mithir" },
  { folder: "Pankaj_Khode_14880", trainer: "Abhisheks" },
  { folder: "Prashantha_Kumara_D_K_10801", trainer: "Pooja Bora" },
  { folder: "Rayies_S_90185205", trainer: "Hitendra" },
  { folder: "Samiksha_Lajurkar_16638", trainer: "Manjira" },
  { folder: "Sridharan_K_M_90184106", trainer: "Amit" },
  { folder: "Venkatesh_90205575", trainer: "Sagar" },
  { folder: "Anil___90222590", trainer: "Vinendra" },
  { folder: "Ashita_Jain_16669", trainer: "Balshree" },
  { folder: "Bhavana_Choudhary_17656", trainer: "Madhu TV" },
  { folder: "Dileep___503845", trainer: "Mithir" },
  { folder: "karthick_M_19128", trainer: "Abhisheks" },
  { folder: "Manikanta___90176461", trainer: "Pooja Bora" },
  { folder: "Moorthy_V_18103", trainer: "Hitendra" },
  { folder: "Perumandla_Vivekananda_16365", trainer: "Manjira" },
  { folder: "R_Sesha_Sai_16134", trainer: "Amit" },
  { folder: "S_Rajeshwar_Reddy_17347", trainer: "Sagar" },
  { folder: "Santosh_M_17256", trainer: "Vinendra" },
  { folder: "Srikar___16091", trainer: "Balshree" },
  { folder: "Annapragada_Dheeraj_18929", trainer: "Madhu TV" },
  { folder: "Ashker_PP_503747", trainer: "Mithir" },
  { folder: "Buddharaju_Seetaramaraju_16087", trainer: "Abhisheks" },
  { folder: "Gulothungan_16699", trainer: "Pooja Bora" },
  { folder: "Kiran_P_Revankar_P015509", trainer: "Hitendra" },
  { folder: "Manoj_Alandkar_90164475", trainer: "Manjira" },
  { folder: "Natarajan___90240344", trainer: "Amit" },
  { folder: "Prasad___90166297", trainer: "Sagar" },
  { folder: "Rakesh___503821", trainer: "Vinendra" },
  { folder: "Sakshi_Dhangekar_16371", trainer: "Balshree" },
  { folder: "Siddarthan_Ps_18941", trainer: "Madhu TV" },
  { folder: "Sudish_Pai_17436", trainer: "Mithir" },
];

// Function to extract name and empId from folder name
const parseFolderName = (folderName) => {
  const parts = folderName.split('_');
  const empId = parts[parts.length - 1];
  // Take only the first two parts for the name
  const nameParts = parts.slice(0, 2);
  const name = nameParts.join(' ');
  return { name, empId };
};
const roles = ["TC", "DFM", "SHE", "HSE", "PSC", "SNE", "DSE", "DPH", "TCI"];

const generateParticipants = () => {
  const participants = [];
  for (let i = 0; i < participantData.length; i++) {
    const data = participantData[i];
    const { name, empId } = parseFolderName(data.folder);
    const role = roles[i % roles.length];
    const trainerName = data.trainer;
    const trainerIndex = trainerNames.indexOf(trainerName);
    const octonormIndex = i % octonormRooms.length;

    participants.push({
      id: `P${String(i + 1).padStart(2, "0")}`,
      name: name,
      empId: empId,
      role: role,
      image: `/userImages/${data.folder}/profile.jpg`,
      timer: null,
      score: null,
      booth: null,
      evaluator: null,
      trainer: trainerName,
      trainerIndex: trainerIndex,
      octonormId: octonormIndex + 1,
      stage: "main",
    });
  }
  return participants;
};

  // Single flat array - array order = display order within each Octonorm room
  const [participants, setParticipants] = useState(generateParticipants());

  const setupData = {
    preparation_booths: 5,
    preparation_time_per_case: 5,
    no_of_evaluators: 5,
    time_per_evaluation_round: 10,
  };

  const totalParticipants = 50;

  // Single timer tick for anyone with an active timer (prep or eval)
  useEffect(() => {
    const interval = setInterval(() => {
      setParticipants((prev) =>
        prev.map((p) => (p.timer > 0 ? { ...p, timer: p.timer - 1 } : p))
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChangeTrainerForParticipant = (participant) => {
    setSelectedTrainerForParticipant(participant);
    setShowChangeTrainer(true);
  };

  const handleSelectTrainer = (trainerIndex) => {
    if (!selectedTrainerForParticipant) return;
    const participantId = selectedTrainerForParticipant.id;
    const trainerName = trainerNames[trainerIndex];

    setParticipants((prev) =>
      prev.map((p) =>
        p.id === participantId ? { ...p, trainer: trainerName, trainerIndex } : p
      )
    );

    setShowChangeTrainer(false);
    setSelectedTrainerForParticipant(null);
  };

  const openPopup = (participant, action) => {
    setSelectedParticipant(participant);
    setPopupAction(action);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedParticipant(null);
    setPopupAction("");
  };

  const handleMove = () => {
    if (!selectedParticipant) return;
    const participantId = selectedParticipant.id;

    setParticipants((prev) => {
      if (popupAction === "toHolding") {
        return prev.map((p) => (p.id === participantId ? { ...p, stage: "holding" } : p));
      }
      if (popupAction === "toPrep") {
        const boothNumber = (prev.filter((p) => p.stage === "prep").length % setupData.preparation_booths) + 1;
        return prev.map((p) =>
          p.id === participantId
            ? { ...p, stage: "prep", booth: boothNumber, timer: setupData.preparation_time_per_case * 60 }
            : p
        );
      }
      if (popupAction === "toEval") {
        const evaluatorNumber = (prev.filter((p) => p.stage === "eval").length % setupData.no_of_evaluators) + 1;
        return prev.map((p) =>
          p.id === participantId
            ? { ...p, stage: "eval", evaluator: `Evaluator ${evaluatorNumber}`, timer: setupData.time_per_evaluation_round * 60 }
            : p
        );
      }
      if (popupAction === "toComplete") {
        return prev.map((p) => (p.id === participantId ? { ...p, stage: "completed", timer: null } : p));
      }
      return prev;
    });

    closePopup();
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const getStageCount = (stage) => participants.filter((p) => p.stage === stage).length;

  // ---- Multi-select helpers ----
  const toggleSelectMode = () => {
    setSelectMode((m) => !m);
    setSelectedIds(new Set());
  };

  const toggleSelectParticipant = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Advance every selected participant by one stage, each from wherever they currently are
  const handleBulkAdvance = () => {
    setParticipants((prev) => {
      let prepCounter = prev.filter((p) => p.stage === "prep").length;
      let evalCounter = prev.filter((p) => p.stage === "eval").length;

      return prev.map((p) => {
        if (!selectedIds.has(p.id)) return p;

        if (p.stage === "main") {
          return { ...p, stage: "holding" };
        }
        if (p.stage === "holding") {
          const boothNumber = (prepCounter % setupData.preparation_booths) + 1;
          prepCounter++;
          return { ...p, stage: "prep", booth: boothNumber, timer: setupData.preparation_time_per_case * 60 };
        }
        if (p.stage === "prep") {
          const evaluatorNumber = (evalCounter % setupData.no_of_evaluators) + 1;
          evalCounter++;
          return { ...p, stage: "eval", evaluator: `Evaluator ${evaluatorNumber}`, timer: setupData.time_per_evaluation_round * 60 };
        }
        if (p.stage === "eval") {
          return { ...p, stage: "completed", timer: null };
        }
        return p; // already completed, nothing further
      });
    });
    clearSelection();
  };

  const handleBulkSelectTrainer = (trainerIndex) => {
    const trainerName = trainerNames[trainerIndex];
    setParticipants((prev) =>
      prev.map((p) => (selectedIds.has(p.id) ? { ...p, trainer: trainerName, trainerIndex } : p))
    );
    setShowBulkTrainer(false);
    clearSelection();
  };
  // ---- end multi-select helpers ----

  const handleParticipantClick = (p) => {
    if (selectMode) {
      toggleSelectParticipant(p.id);
      return;
    }
    // Ignore the click that follows a drag-and-drop
    if (dragOccurredRef.current) {
      dragOccurredRef.current = false;
      return;
    }
    if (p.stage === "main") openPopup(p, "toHolding");
    else if (p.stage === "holding") openPopup(p, "toPrep");
    else if (p.stage === "prep") openPopup(p, "toEval");
    else if (p.stage === "eval") openPopup(p, "toComplete");
  };

  // ---- Drag & drop handlers ----
  const handleDragStart = (e, participant) => {
    if (selectMode) {
      e.preventDefault();
      return;
    }
    setDraggedId(participant.id);
    dragOccurredRef.current = false;
    e.dataTransfer.effectAllowed = "move";
    // Some browsers require data to be set for drag to work
    e.dataTransfer.setData("text/plain", participant.id);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverRoomId(null);
  };

  const handleCardDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleCardDrop = (e, targetParticipant) => {
    e.preventDefault();
    e.stopPropagation();
    dragOccurredRef.current = true;
    const sourceId = draggedId;
    setDragOverRoomId(null);
    setDraggedId(null);
    if (!sourceId || sourceId === targetParticipant.id) return;

    setParticipants((prev) => {
      const arr = [...prev];
      const fromIndex = arr.findIndex((p) => p.id === sourceId);
      if (fromIndex === -1) return prev;
      const [item] = arr.splice(fromIndex, 1);
      const updatedItem = { ...item, octonormId: targetParticipant.octonormId };
      const toIndex = arr.findIndex((p) => p.id === targetParticipant.id);
      const insertIndex = toIndex === -1 ? arr.length : toIndex;
      arr.splice(insertIndex, 0, updatedItem);
      return arr;
    });
  };

  const handleRoomDragOver = (e, roomId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverRoomId(roomId);
  };

  const handleRoomDragLeave = (roomId) => {
    setDragOverRoomId((prev) => (prev === roomId ? null : prev));
  };

  const handleRoomDrop = (e, roomId) => {
    e.preventDefault();
    dragOccurredRef.current = true;
    const sourceId = draggedId;
    setDragOverRoomId(null);
    setDraggedId(null);
    if (!sourceId) return;

    setParticipants((prev) => {
      const arr = [...prev];
      const fromIndex = arr.findIndex((p) => p.id === sourceId);
      if (fromIndex === -1) return prev;
      const [item] = arr.splice(fromIndex, 1);
      const updatedItem = { ...item, octonormId: roomId };
      arr.push(updatedItem); // appended -> lands at end of that room's display order
      return arr;
    });
  };
  // ---- end drag & drop handlers ----

  const stageBorderColors = {
    main: "border-6 border-purple-400 hover:border-purple-500",
    holding: "border-6 border-yellow-400 hover:border-yellow-500",
    prep: "border-6 border-sky-500 hover:border-sky-600",
    eval: "border-6 border-rose-500 hover:border-rose-600",
    completed: "border-6 border-green-400 hover:border-green-500",
  };

  const stageShortLabels = {
    main: "MAIN",
    holding: "HOLD (PRE)",
    prep: "PREP",
    eval: "EVAL",
    completed: "HOLD (POST)",
  };

  const stats = [
    { key: "main", label: "MAIN", value: getStageCount("main"), icon: Gamepad2, from: "#8B5CF6", to: "#7C3AED" },
    { key: "holding", label: "HOLD (PRE)", value: getStageCount("holding"), icon: Hourglass, from: "#FBBF24", to: "#F59E0B" },
    { key: "prep", label: "PREP", value: getStageCount("prep"), icon: Settings, from: "#0EA5E9", to: "#0284C7" },
    { key: "eval", label: "EVAL", value: getStageCount("eval"), icon: ClipboardList, from: "#F43F5E", to: "#E11D48" },
    { key: "completed", label: "HOLD (POST)", value: getStageCount("completed"), icon: Flag, from: "#34D399", to: "#10B981" },
  ];
  const getStepLabel = (action) => {
    const steps = {
      toHolding: { current: "📌 MAIN", next: "📋 HOLD (PRE)", step: 1 },
      toPrep: { current: "⏳ HOLD (PRE)", next: "⚙️ PREP", step: 2 },
      toEval: { current: "🔄 PREP", next: "💻 EVAL", step: 3 },
      toComplete: { current: "📝 EVAL", next: "🏁 HOLD (POST)", step: 4 },
    };
    return steps[action] || { current: "", next: "", step: 0 };
  };

  // Group participants by Octonorm room, preserving array order (= display/drag order)
  const getParticipantsByOctonorm = () => {
    const rooms = {};
    octonormRooms.forEach((room) => {
      rooms[room.id] = participants.filter((p) => p.octonormId === room.id);
    });
    return rooms;
  };

  const roomsData = getParticipantsByOctonorm();

  // Trainer Legend Component
  const TrainerLegend = () => {
    const uniqueTrainers = [...new Set(participants.map(p => p.trainer))];
    return (
      <div className="flex flex-wrap items-center gap-2">
        {uniqueTrainers.map((trainer) => {
          const colors = trainerColors[trainer];
          return (
            <div key={trainer} className="flex items-center gap-1">
              <span className={`h-2.5 w-2.5 rounded-full ${colors?.bg || 'bg-gray-400'}`} />
              <span className="text-[10px] font-medium text-gray-700">{trainer}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-4 font-sans pb-24">
      {/* Top stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-3">
        <div className="relative col-span-2 sm:col-span-1 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B0E1F] to-[#171B34] p-4 text-white shadow-lg">
          <div
            className="absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1.5px)",
              backgroundSize: "10px 10px",
            }}
          />
          <div className="relative">
            <p className="text-[10px] font-semibold tracking-wider text-gray-300">
              TOTAL CONTROLLERS
            </p>
            <p className="mt-2 text-3xl font-extrabold leading-none">{totalParticipants}</p>
            <div className="mt-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
              <Users className="h-3.5 w-3.5 text-gray-200" />
            </div>
          </div>
        </div>

        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.key}
              className="relative overflow-hidden rounded-2xl p-4 text-white shadow-lg"
              style={{ backgroundImage: `linear-gradient(135deg, ${s.from}, ${s.to})` }}
            >
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-bold tracking-wider">{s.label}</p>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold leading-none">{s.value}</p>
              <p className="mt-1 text-[10px] font-medium text-white/70">Controllers</p>
            </div>
          );
        })}

        <div className="col-span-2 sm:col-span-4 lg:col-span-1 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <svg width="90" height="20" viewBox="0 0 90 20" className="text-gray-800">
              {[2, 4, 2, 6, 3, 2, 5, 2, 4, 2, 6, 2, 3, 5, 2, 4, 2, 3, 6, 2].map((w, idx) => {
                let x = 0;
                for (let k = 0; k < idx; k++) x += [2, 4, 2, 6, 3, 2, 5, 2, 4, 2, 6, 2, 3, 5, 2, 4, 2, 3, 6, 2][k] + 1;
                return <rect key={idx} x={x} y="0" width={w} height="20" fill="currentColor" />;
              })}
            </svg>
            <span className="text-amber-400 text-xs">★★★★★</span>
          </div>
          <p className="mt-2 text-sm font-bold text-gray-800">CONTROLLER PANEL</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] text-gray-500">All Systems Live</span>
          </div>
        </div>
      </div>

      {/* Select mode toggle bar */}
      <div className="mb-3 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <MousePointerClick className="h-4 w-4 text-gray-500" />
          <span className="text-xs font-semibold text-gray-600">
            {selectMode ? "Select mode: tap cards to select" : "Tap a card to move it forward"}
          </span>
        </div>
        <button
          onClick={toggleSelectMode}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
            selectMode
              ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {selectMode ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
          {selectMode ? "Exit Select Mode" : "Select Multiple"}
        </button>
      </div>

      {/* Octonorm Header Row - No Colors */}
      <div className="grid grid-cols-10 gap-1 mb-2">
        {octonormRooms.map((room) => (
          <div
            key={room.id}
            className="rounded-t-lg py-1.5 px-2 text-center text-white font-bold text-xs bg-gray-700"
          >
            {room.name.replace("Octonorm ", "O")}
          </div>
        ))}
      </div>

      {/* Octonorm Content - All 10 Columns Side by Side */}
      <div className="grid grid-cols-10 gap-1">
        {octonormRooms.map((room) => {
          const participantsInRoom = roomsData[room.id] || [];
          const isDragOverEmpty = dragOverRoomId === room.id;

          return (
            <div
              key={room.id}
              onDragOver={(e) => handleRoomDragOver(e, room.id)}
              onDragLeave={() => handleRoomDragLeave(room.id)}
              onDrop={(e) => handleRoomDrop(e, room.id)}
              className={`rounded-b-lg p-1.5 min-h-[200px] border-x border-b transition-colors ${
                isDragOverEmpty ? "border-indigo-400 bg-indigo-50/50" : "border-gray-300"
              }`}
            >
              <div className="space-y-1">
                {participantsInRoom.map((p) => {
                  const stage = p.stage;
                  const border = stageBorderColors[stage];
                  const shortLabel = stageShortLabels[stage];
                  const isDragging = draggedId === p.id;
                  const isSelected = selectedIds.has(p.id);
                  const trainerColor = trainerColors[p.trainer];

                  return (
                    <div
                      key={p.id}
                      draggable={!selectMode}
                      onDragStart={(e) => handleDragStart(e, p)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleCardDragOver}
                      onDrop={(e) => handleCardDrop(e, p)}
                      onClick={() => handleParticipantClick(p)}
                      className={`group relative flex ${selectMode ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"} flex-col items-center rounded-lg bg-white p-1 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${border} ${
                        isDragging ? "opacity-30" : ""
                      } ${isSelected ? "ring-4 ring-indigo-500 ring-offset-1" : ""}`}
                    >
                      {selectMode && (
                        <div
                          className={`absolute -top-1.5 -left-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white shadow-sm ${
                            isSelected ? "bg-indigo-600" : "bg-gray-300"
                          }`}
                        >
                          {isSelected && <CheckSquare className="h-2.5 w-2.5 text-white" />}
                        </div>
                      )}

                      <div className="relative">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-10 w-10 rounded-full object-cover"
                          draggable={false}
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.parentElement.innerHTML = `
                              <div class="h-7 w-7 rounded-full flex items-center justify-center text-white text-[7px] font-bold bg-gray-400">
                                ${p.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                              </div>
                            `;
                          }}
                        />
                        {p.timer > 0 && (
                          <div className="absolute -bottom-0.5 -right-0.5 rounded-full border border-white bg-red-500 p-0.5 shadow-sm">
                            <Clock className="h-2 w-2 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="mt-0.5 w-full truncate text-center text-[10px] font-semibold leading-tight text-black">
                        {p.name}
                      </div>

                      {/* Trainer name with colored background box */}
                      <div className="mt-0.5 w-full flex justify-center">
                        <span className={`px-1 py-0.5 rounded text-[9px] font-semibold ${trainerColor?.bg || 'bg-gray-400'} text-white`}>
                          {p.trainer}
                        </span>
                      </div>

                      {p.timer > 0 && (
                        <div className={`mt-0.5 text-[10px] font-bold ${p.timer < 60 ? "animate-pulse text-red-500" : "text-blue-500"}`}>
                          {formatTime(p.timer)}
                        </div>
                      )}
                    </div>
                  );
                })}
                {participantsInRoom.length === 0 && (
                  <div className="text-center text-[8px] text-gray-400 py-4">
                    {isDragOverEmpty ? "Drop here" : "—"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

       {/* Trainer Legend */}
      <div className="mt-3 rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-gray-400">TRAINERS:</span>
          <TrainerLegend />
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 text-[10px]">
          <span className="font-semibold text-gray-400">LEGEND:</span>
          <LegendDot color="bg-purple-500" label="MAIN" />
          <LegendDot color="bg-yellow-500" label="HOLD (PRE)" />
          <LegendDot color="bg-sky-500" label="PREP" />
          <LegendDot color="bg-rose-500" label="EVAL" />
          <LegendDot color="bg-green-500" label="HOLD (POST)" />
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <Clock className="h-3 w-3 text-red-500" />
          <span>Timer active</span>
          <span className="text-gray-300">|</span>
          <span>
            {selectMode
              ? "💡 Tap cards to select, then use the bar below for bulk actions"
              : "💡 Click a card to advance it · Drag a card to move/reorder it · Use \"Select Multiple\" for bulk actions"}
          </span>
        </div>
      </div>

      {/* Floating bulk action bar */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-gray-900 px-4 py-2.5 text-white shadow-2xl animate-fadeIn">
          <span className="text-xs font-bold whitespace-nowrap">{selectedIds.size} selected</span>
          <div className="h-4 w-px bg-white/20" />
          <button
            onClick={handleBulkAdvance}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold hover:bg-indigo-500 transition whitespace-nowrap"
          >
            → Move Forward
          </button>
          <button
            onClick={() => setShowBulkTrainer(true)}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold hover:bg-emerald-500 transition whitespace-nowrap"
          >
            Change Trainer
          </button>
          <button
            onClick={clearSelection}
            className="rounded-lg bg-gray-700 px-3 py-1.5 text-[11px] font-semibold hover:bg-gray-600 transition whitespace-nowrap"
          >
            Clear
          </button>
        </div>
      )}

      {/* Popup Modal */}
      {showPopup && selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="mx-4 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl animate-slideUp">
            <div
              className="px-5 py-3.5"
              style={{
                backgroundImage:
                  popupAction === "toHolding"
                    ? "linear-gradient(135deg, #8B5CF6, #7C3AED)"
                    : popupAction === "toPrep"
                    ? "linear-gradient(135deg, #FBBF24, #F59E0B)"
                    : popupAction === "toEval"
                    ? "linear-gradient(135deg, #0EA5E9, #0284C7)"
                    : "linear-gradient(135deg, #34D399, #10B981)",
              }}
            >
              <div className="flex items-center gap-3">
                <img
                  src={selectedParticipant.image}
                  alt={selectedParticipant.name}
                  className="h-14 w-14 rounded-full object-cover ring-4 ring-white/30 shadow-lg"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentElement.innerHTML = `
                      <div class="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg bg-gray-500">
                        ${selectedParticipant.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                    `;
                  }}
                />
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white">{selectedParticipant.name}</h3>
                  <p className="text-xs text-white/70">{selectedParticipant.empId}</p>
                  <p className="text-[10px] text-white/50">{selectedParticipant.role}</p>
                </div>
                <button
                  onClick={closePopup}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-4">
              {/* 5 Steps Flow */}
              <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="text-[10px] font-semibold text-gray-400 mb-2">FLOW STEPS</div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      popupAction === "toHolding" ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-400"
                    }`}>
                      1
                    </div>
                    <span className="text-[8px] text-gray-500 mt-0.5">MAIN</span>
                  </div>
                  <div className="flex-1 h-0.5 mx-1 bg-gray-200">
                    <div className={`h-0.5 ${popupAction === "toHolding" ? "bg-indigo-600" : "bg-gray-200"}`} style={{ width: "100%" }}></div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      popupAction === "toPrep" ? "bg-amber-500 text-white" : "bg-gray-200 text-gray-400"
                    }`}>
                      2
                    </div>
                    <span className="text-[8px] text-gray-500 mt-0.5">HOLD (PRE)</span>
                  </div>
                  <div className="flex-1 h-0.5 mx-1 bg-gray-200">
                    <div className={`h-0.5 ${popupAction === "toPrep" ? "bg-amber-500" : "bg-gray-200"}`} style={{ width: "100%" }}></div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      popupAction === "toEval" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-400"
                    }`}>
                      3
                    </div>
                    <span className="text-[8px] text-gray-500 mt-0.5">PREP</span>
                  </div>
                  <div className="flex-1 h-0.5 mx-1 bg-gray-200">
                    <div className={`h-0.5 ${popupAction === "toEval" ? "bg-blue-500" : "bg-gray-200"}`} style={{ width: "100%" }}></div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      popupAction === "toComplete" ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-400"
                    }`}>
                      4
                    </div>
                    <span className="text-[8px] text-gray-500 mt-0.5">EVAL</span>
                  </div>
                  <div className="flex-1 h-0.5 mx-1 bg-gray-200">
                    <div className={`h-0.5 ${popupAction === "toComplete" ? "bg-orange-500" : "bg-gray-200"}`} style={{ width: "100%" }}></div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      popupAction === "toComplete" ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-400"
                    }`}>
                      5
                    </div>
                    <span className="text-[8px] text-gray-500 mt-0.5">HOLD (POST)</span>
                  </div>
                </div>
              </div>

              <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Current</span>
                  <span className="font-medium text-gray-700">
                    {getStepLabel(popupAction).current}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-gray-100 pt-1.5 text-xs">
                  <span className="text-gray-400">Next</span>
                  <span className={`font-semibold ${
                    popupAction === "toHolding" ? "text-indigo-600" :
                    popupAction === "toPrep" ? "text-amber-600" :
                    popupAction === "toEval" ? "text-blue-600" :
                    "text-emerald-600"
                  }`}>
                    {getStepLabel(popupAction).next}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-gray-100 pt-1.5 text-xs">
                  <span className="text-gray-400">Octonorm</span>
                  <span className="font-medium text-gray-700">
                    {octonormRooms.find((r) => r.id === selectedParticipant.octonormId)?.name}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-gray-100 pt-1.5 text-xs">
                  <span className="text-gray-400">Trainer</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${trainerColors[selectedParticipant.trainer]?.bg || 'bg-gray-400'} text-white`}>
                      {selectedParticipant.trainer}
                    </span>
                    <button
                      onClick={() => handleChangeTrainerForParticipant(selectedParticipant)}
                      className="text-[9px] font-medium text-indigo-600 hover:text-indigo-800 transition"
                    >
                      Change
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={closePopup}
                  className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMove}
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg transition hover:shadow-xl"
                  style={{
                    backgroundImage:
                      popupAction === "toHolding"
                        ? "linear-gradient(135deg, #8B5CF6, #7C3AED)"
                        : popupAction === "toPrep"
                        ? "linear-gradient(135deg, #FBBF24, #F59E0B)"
                        : popupAction === "toEval"
                        ? "linear-gradient(135deg, #0EA5E9, #0284C7)"
                        : "linear-gradient(135deg, #34D399, #10B981)",
                  }}
                >
                  {popupAction === "toComplete" ? "✅ Move to Hold (Post)" : "→ Move"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Trainer Modal (single) */}
      {showChangeTrainer && selectedTrainerForParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="mx-4 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl animate-slideUp">
            <div className="px-5 py-3.5 bg-gradient-to-r from-purple-600 to-purple-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-white" />
                  <span className="text-sm font-bold text-white">Change Trainer</span>
                </div>
                <button
                  onClick={() => {
                    setShowChangeTrainer(false);
                    setSelectedTrainerForParticipant(null);
                  }}
                  className="text-white/70 hover:text-white transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-white/70 mt-1">
                {selectedTrainerForParticipant.name} - Current: {selectedTrainerForParticipant.trainer}
              </p>
            </div>

            <div className="p-4 max-h-80 overflow-y-auto">
              <div className="space-y-1">
                {trainerNames.map((trainer, idx) => {
                  const colors = trainerColors[trainer];
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectTrainer(idx)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition flex items-center justify-between ${
                        idx === selectedTrainerForParticipant.trainerIndex
                          ? `ring-2 ring-indigo-500 ${colors?.bg || 'bg-gray-400'} text-white`
                          : `hover:${colors?.bg || 'bg-gray-100'}`
                      }`}
                    >
                      <span className={idx === selectedTrainerForParticipant.trainerIndex ? 'text-white' : 'text-gray-700'}>
                        {trainer}
                      </span>
                      {idx === selectedTrainerForParticipant.trainerIndex && (
                        <span className="text-[10px] font-bold text-white">✓ Current</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-100 px-4 py-3">
              <button
                onClick={() => {
                  setShowChangeTrainer(false);
                  setSelectedTrainerForParticipant(null);
                }}
                className="w-full rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Change Trainer Modal */}
      {showBulkTrainer && selectedIds.size > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="mx-4 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl animate-slideUp">
            <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-white" />
                  <span className="text-sm font-bold text-white">Change Trainer (Bulk)</span>
                </div>
                <button
                  onClick={() => setShowBulkTrainer(false)}
                  className="text-white/70 hover:text-white transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-white/70 mt-1">
                Applying to {selectedIds.size} selected participant{selectedIds.size > 1 ? "s" : ""}
              </p>
            </div>

            <div className="p-4 max-h-80 overflow-y-auto">
              <div className="space-y-1">
                {trainerNames.map((trainer, idx) => {
                  const colors = trainerColors[trainer];
                  return (
                    <button
                      key={idx}
                      onClick={() => handleBulkSelectTrainer(idx)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition flex items-center justify-between hover:${colors?.bg || 'bg-gray-100'} hover:text-white`}
                    >
                      <span className="text-gray-700">{trainer}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-100 px-4 py-3">
              <button
                onClick={() => setShowBulkTrainer(false)}
                className="w-full rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(30px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.25s ease-out; }
      `}</style>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="font-medium text-gray-700">{label}</span>
    </span>
  );
}