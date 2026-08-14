// DigitalFlow.jsx
import React,{ useState, useEffect, useRef } from "react";
import axios from "axios";
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
  Bike,
} from "lucide-react";

export default function DigitalFlow() {
  // ---- State ----
  const [participants, setParticipants] = useState([]);
  const [rooms, setRooms] = useState([]);               // from DB
  const [trainers, setTrainers] = useState([]);
  const [setup, setSetup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state (popups, drag, multi‑select)
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupAction, setPopupAction] = useState("");
  const [showChangeTrainer, setShowChangeTrainer] = useState(false);
  const [selectedTrainerForParticipant, setSelectedTrainerForParticipant] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverRoomId, setDragOverRoomId] = useState(null);
  const dragOccurredRef = useRef(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkTrainer, setShowBulkTrainer] = useState(false);

  // ---- Fetch data from API ----
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:5000/api/setup");
        if (response.data.success) {
          const { setup, trainers, rooms, participants: dbParticipants, rounds } = response.data.data;

          setSetup(setup);
          setTrainers(trainers);

          // Map rooms to the format expected by the grid (octonormRooms)
          const mappedRooms = rooms.map(r => ({
            id: r.id,
            name: r.name,
            bikeName: r.vehicle_name || null,
          }));
          setRooms(mappedRooms);

          // Map participants to the UI format
          const mappedParticipants = dbParticipants.map(p => ({
            id: String(p.id),                         // use numeric id as string
            name: p.name,
            empId: p.employee_id,
            role: p.role || "",
             language: p.language || "",  
              profileImage: p.profile_image ? `http://localhost:5000${p.profile_image}` : null,
            // image: p.image || `/userImages/default.jpg`, // we'll use placeholder
            timer: p.timer || null,
            booth: p.booth || null,
            evaluator: p.evaluator || null,
            trainer: p.trainer_name || "",
            trainerId: p.trainer_id,
            octonormId: p.room_id,                    // current room id
            stage: p.stage || "main",
            // We'll store the DB id separately for updates
            dbId: p.id,
          }));

          setParticipants(mappedParticipants);
        } else {
          setError("Failed to load data from API");
        }
      } catch (err) {
        console.error("Error fetching setup:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ---- Timer tick ----
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.timer > 0 ? { ...p, timer: p.timer - 1 } : p
        )
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [loading]);

  // ---- Helper functions (unchanged) ----
  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const getStageCount = (stage) =>
    participants.filter((p) => p.stage === stage).length;

  // ---- Build trainer colors dynamically ----
  const trainerColors = {};
  trainers.forEach((t) => {
    // Assign a consistent color based on index (or use a hash)
    const colors = ["red-500", "blue-500", "green-500", "yellow-500", "purple-500", "pink-500", "indigo-500", "teal-500", "orange-500", "cyan-500"];
    const idx = trainers.findIndex(t2 => t2.id === t.id) % colors.length;
    trainerColors[t.name] = { bg: `bg-${colors[idx]}` };
  });

  const trainerNames = trainers.map(t => t.name);

  // ---- UI event handlers (same logic, but we'll need to update DB later) ----
  const handleChangeTrainerForParticipant = (participant) => {
    setSelectedTrainerForParticipant(participant);
    setShowChangeTrainer(true);
  };

  const handleSelectTrainer = (trainerIndex) => {
    if (!selectedTrainerForParticipant) return;
    const participantId = selectedTrainerForParticipant.id;
    const trainerName = trainerNames[trainerIndex];
    const trainerId = trainers.find(t => t.name === trainerName)?.id;

    setParticipants((prev) =>
      prev.map((p) =>
        p.id === participantId
          ? { ...p, trainer: trainerName, trainerId }
          : p
      )
    );
    // TODO: call PUT /api/participants/:id to persist
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

  // We need setupData from the API: preparation_booths, etc.
  const setupData = {
    preparation_booths: setup?.preparation_booths || 5,
    preparation_time_per_case: setup?.preparation_time || 5,
    no_of_evaluators: 5, // can be added to setup table later
    time_per_evaluation_round: 10, // from rounds? we'll use static for now
    time_per_bike_round: 10,
  };

  const handleMove = () => {
    if (!selectedParticipant) return;
    const participantId = selectedParticipant.id;

    setParticipants((prev) => {
      if (popupAction === "toHolding") {
        return prev.map((p) =>
          p.id === participantId ? { ...p, stage: "holding" } : p
        );
      }
      if (popupAction === "toPrep") {
        const boothNumber =
          (prev.filter((p) => p.stage === "prep").length % setupData.preparation_booths) + 1;
        return prev.map((p) =>
          p.id === participantId
            ? {
                ...p,
                stage: "prep",
                booth: boothNumber,
                timer: setupData.preparation_time_per_case * 60,
              }
            : p
        );
      }
      if (popupAction === "toEval") {
        const evaluatorNumber =
          (prev.filter((p) => p.stage === "eval").length % setupData.no_of_evaluators) + 1;
        return prev.map((p) =>
          p.id === participantId
            ? {
                ...p,
                stage: "eval",
                evaluator: `Evaluator ${evaluatorNumber}`,
                timer: setupData.time_per_evaluation_round * 60,
              }
            : p
        );
      }
      if (popupAction === "toBike") {
        return prev.map((p) =>
          p.id === participantId
            ? { ...p, stage: "bike", timer: setupData.time_per_bike_round * 60 }
            : p
        );
      }
      if (popupAction === "toComplete") {
        return prev.map((p) =>
          p.id === participantId ? { ...p, stage: "completed", timer: null } : p
        );
      }
      return prev;
    });
    // TODO: call API to update participant state
    closePopup();
  };

  // ---- Multi‑select helpers ----
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
          return {
            ...p,
            stage: "prep",
            booth: boothNumber,
            timer: setupData.preparation_time_per_case * 60,
          };
        }
        if (p.stage === "prep") {
          const evaluatorNumber = (evalCounter % setupData.no_of_evaluators) + 1;
          evalCounter++;
          return {
            ...p,
            stage: "eval",
            evaluator: `Evaluator ${evaluatorNumber}`,
            timer: setupData.time_per_evaluation_round * 60,
          };
        }
        if (p.stage === "eval") {
          return { ...p, stage: "bike", timer: setupData.time_per_bike_round * 60 };
        }
        if (p.stage === "bike") {
          return { ...p, stage: "completed", timer: null };
        }
        return p;
      });
    });
    // TODO: bulk update API
    clearSelection();
  };

  const handleBulkSelectTrainer = (trainerIndex) => {
    const trainerName = trainerNames[trainerIndex];
    const trainerId = trainers.find(t => t.name === trainerName)?.id;
    setParticipants((prev) =>
      prev.map((p) =>
        selectedIds.has(p.id)
          ? { ...p, trainer: trainerName, trainerId }
          : p
      )
    );
    setShowBulkTrainer(false);
    clearSelection();
  };

  // ---- Participant click ----
  const handleParticipantClick = (p) => {
    if (selectMode) {
      toggleSelectParticipant(p.id);
      return;
    }
    if (dragOccurredRef.current) {
      dragOccurredRef.current = false;
      return;
    }
    if (p.stage === "main") openPopup(p, "toHolding");
    else if (p.stage === "holding") openPopup(p, "toPrep");
    else if (p.stage === "prep") openPopup(p, "toEval");
    else if (p.stage === "eval") openPopup(p, "toBike");
    else if (p.stage === "bike") openPopup(p, "toComplete");
  };

  // ---- Drag & Drop ----
  const handleDragStart = (e, participant) => {
    if (selectMode) {
      e.preventDefault();
      return;
    }
    setDraggedId(participant.id);
    dragOccurredRef.current = false;
    e.dataTransfer.effectAllowed = "move";
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
       console.log('Card drop: new order', arr.map(p => p.name));
      return arr;
    });
    // TODO: update room_id and position in DB
  };

  const handleCellDrop = (e, roomId, rowIndex) => {
    e.preventDefault();
    e.stopPropagation();
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

      let count = 0;
      let targetParticipant = null;
      for (let p of arr) {
        if (p.octonormId === roomId) {
          if (count === rowIndex) {
            targetParticipant = p;
            break;
          }
          count++;
        }
      }

      if (targetParticipant) {
        const toIndex = arr.findIndex((p) => p.id === targetParticipant.id);
        if (toIndex === -1) arr.push({ ...item, octonormId: roomId });
        else arr.splice(toIndex, 0, { ...item, octonormId: roomId });
      } else {
        arr.push({ ...item, octonormId: roomId });
      }
      return arr;
    });
    // TODO: update DB
  };

  // ---- UI Rendering ----
  const stageBorderColors = {
    main: "border-6 border-purple-400 hover:border-purple-500",
    holding: "border-6 border-yellow-400 hover:border-yellow-500",
    prep: "border-6 border-sky-500 hover:border-sky-600",
    eval: "border-6 border-rose-500 hover:border-rose-600",
    bike: "border-6 border-orange-400 hover:border-orange-500",
    completed: "border-6 border-green-400 hover:border-green-500",
  };

  const stats = [
    { key: "main", label: "MAIN", icon: Gamepad2, from: "#8B5CF6", to: "#7C3AED" },
    { key: "holding", label: "HOLD (PRE)", icon: Hourglass, from: "#FBBF24", to: "#F59E0B" },
    { key: "prep", label: "PREP", icon: Settings, from: "#0EA5E9", to: "#0284C7" },
    { key: "eval", label: "EVAL", icon: ClipboardList, from: "#F43F5E", to: "#E11D48" },
    { key: "bike", label: "BIKE", icon: Monitor, from: "#F97316", to: "#EA580C" },
    { key: "completed", label: "HOLD (POST)", icon: Flag, from: "#34D399", to: "#10B981" },
  ].map(s => ({ ...s, value: getStageCount(s.key) }));

  const getStepLabel = (action) => {
    const steps = {
      toHolding: { current: "📌 MAIN", next: "📋 HOLD (PRE)", step: 1 },
      toPrep: { current: "⏳ HOLD (PRE)", next: "⚙️ PREP", step: 2 },
      toEval: { current: "🔄 PREP", next: "💻 EVAL", step: 3 },
      toBike: { current: "📝 EVAL", next: "🚴 BIKE", step: 4 },
      toComplete: { current: "🚴 BIKE", next: "🏁 HOLD (POST)", step: 5 },
    };
    return steps[action] || { current: "", next: "", step: 0 };
  };

  // Group participants by room
  const getParticipantsByRoom = () => {
    const map = {};
    rooms.forEach((room) => {
      map[room.id] = participants.filter((p) => p.octonormId === room.id);
    });
    return map;
  };

  const roomsData = getParticipantsByRoom();
  const maxRows = Math.max(0, ...Object.values(roomsData).map(arr => arr.length));
  const timeLabels = [];
  let currentTime = new Date();
  currentTime.setHours(9, 0, 0, 0);
  for (let i = 0; i < maxRows; i++) {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const h12 = hours % 12 || 12;
    timeLabels.push(`${String(h12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${ampm}`);
    currentTime.setMinutes(currentTime.getMinutes() + 30);
  }

  const TrainerLegend = () => {
    const uniqueTrainers = [...new Set(participants.map(p => p.trainer))];
    return (
      <div className="flex flex-wrap items-center gap-2">
        {uniqueTrainers.map((trainer) => (
          <div key={trainer} className="flex items-center gap-1">
            <span className={`h-2.5 w-2.5 rounded-full ${trainerColors[trainer]?.bg || "bg-gray-400"}`} />
            <span className="text-[10px] font-medium text-gray-700">{trainer}</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assessment data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <p className="text-red-600 font-semibold">Error loading data</p>
          <p className="text-sm text-gray-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-4 font-sans pb-24">
      {/* Top stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-3">
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
            <p className="text-[10px] font-semibold tracking-wider text-gray-300">TOTAL CONTROLLERS</p>
            <p className="mt-2 text-3xl font-extrabold leading-none">{participants.length}</p>
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

      {/* Select mode bar */}
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

      {/* Grid */}
      <div className="grid grid-cols-[80px_repeat(10,1fr)] gap-1">
        <div className="rounded-t-lg bg-gray-700 py-1.5 px-2 text-center font-bold text-white">Time</div>
        {rooms.map((room) => (
          <div
            key={room.id}
            className="rounded-t-lg bg-gray-700 py-1.5 px-2 text-center flex flex-col items-center leading-tight"
          >
            {room.bikeName && (
              <span className="text-yellow-400 font-bold text-[10px] flex items-center gap-0.5">
                <Bike className="h-3 w-3" />
                {room.bikeName}
              </span>
            )}
            <span className="text-white font-bold text-xs">{room.name.replace("Octonorm ", "O")}</span>
          </div>
        ))}

        {Array.from({ length: maxRows }).map((_, rowIdx) => (
          <div key={`row-${rowIdx}`} className="contents">
            <div className="bg-gray-100 border border-gray-200 min-h-[80px] flex items-center justify-center">
              <span className="text-xs font-semibold">{timeLabels[rowIdx] || ""}</span>
            </div>

            {rooms.map((room) => {
              const participant = roomsData[room.id]?.[rowIdx] || null;
              return (
                <div
                  key={`${room.id}-${rowIdx}`}
                  className="p-1 border border-gray-200 min-h-[80px] relative transition-colors"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    setDragOverRoomId(room.id);
                  }}
                  onDragLeave={() => setDragOverRoomId(null)}
                  onDrop={(e) => handleCellDrop(e, room.id, rowIdx)}
                >
                  {participant ? (
                    <div
                      key={participant.id}
                      draggable={!selectMode}
                      onDragStart={(e) => handleDragStart(e, participant)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleCardDragOver}
                      onDrop={(e) => handleCardDrop(e, participant)}
                      onClick={() => handleParticipantClick(participant)}
                      className={`group relative flex ${
                        selectMode ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
                      } flex-col items-center rounded-lg bg-white p-1 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${
                        stageBorderColors[participant.stage]
                      } ${draggedId === participant.id ? "opacity-30" : ""} ${
                        selectedIds.has(participant.id) ? "ring-4 ring-indigo-500 ring-offset-1" : ""
                      }`}
                    >
                      {selectMode && (
                        <div
                          className={`absolute -top-1.5 -left-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white shadow-sm ${
                            selectedIds.has(participant.id) ? "bg-indigo-600" : "bg-gray-300"
                          }`}
                        >
                          {selectedIds.has(participant.id) && <CheckSquare className="h-2.5 w-2.5 text-white" />}
                        </div>
                      )}
 <div className="relative">
  {participant.profileImage ? (
    <img
      src={participant.profileImage}
      alt={participant.name}
      className="h-10 w-10 rounded-full object-cover"
      onError={(e) => {
        e.target.style.display = 'none';
        e.target.parentElement.innerHTML = `
          <div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
            ${participant.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
          </div>
        `;
      }}
    />
  ) : (
    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
      {participant.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
    </div>
  )}
  {participant.timer > 0 && (
    <div className="absolute -bottom-0.5 -right-0.5 rounded-full border border-white bg-red-500 p-0.5 shadow-sm">
      <Clock className="h-2 w-2 text-white" />
    </div>
  )}
</div>
                      <div className="mt-0.5 w-full truncate text-center text-[10px] font-semibold leading-tight text-black">
                        {participant.name}
                      </div>
                     <div className="mt-0.5 w-full truncate text-center text-[10px] font-semibold leading-tight text-black">
  ({participant.role} · {participant.language || '—'})
</div>
                      <div className="mt-0.5 w-full flex justify-center">
                        <span
                          className={`px-1 py-0.5 rounded text-[9px] font-semibold ${
                            trainerColors[participant.trainer]?.bg || "bg-gray-400"
                          } text-white`}
                        >
                          {participant.trainer}
                        </span>
                      </div>
                      {participant.timer > 0 && (
                        <div
                          className={`mt-0.5 text-[10px] font-bold ${
                            participant.timer < 60 ? "animate-pulse text-red-500" : "text-blue-500"
                          }`}
                        >
                          {formatTime(participant.timer)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-[8px] text-gray-300 py-4">—</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
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
          <LegendDot color="bg-orange-500" label="BIKE" />
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

      {/* Bulk action bar */}
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

      {/* Popup Modal - same as before, using selectedParticipant */}
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
                    : popupAction === "toBike"
                    ? "linear-gradient(135deg, #F97316, #EA580C)"
                    : "linear-gradient(135deg, #34D399, #10B981)",
              }}
            >
              <div className="flex items-center gap-3">
               <div className="relative">
  {selectedParticipant.profileImage ? (
    <img
      src={selectedParticipant.profileImage}
      alt={selectedParticipant.name}
      className="h-14 w-14 rounded-full object-cover ring-4 ring-white/30 shadow-lg"
      onError={(e) => {
        e.target.style.display = 'none';
        e.target.parentElement.querySelector('.popup-initials').style.display = 'flex';
      }}
    />
  ) : null}
  <div
    className={`h-14 w-14 rounded-full bg-gray-400 flex items-center justify-center text-lg font-bold text-white shadow-lg ${selectedParticipant.profileImage ? 'popup-initials' : ''}`}
    style={{ display: selectedParticipant.profileImage ? 'none' : 'flex' }}
  >
    {selectedParticipant.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
  </div>
</div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white">{selectedParticipant.name}</h3>
                  <p className="text-xs text-white/70">{selectedParticipant.empId}</p>
                   <p className="text-[10px] text-white/50">
    {selectedParticipant.role} · {selectedParticipant.language || '—'}
  </p>
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
              {/* Flow steps (unchanged) */}
              <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="text-[10px] font-semibold text-gray-400 mb-2">FLOW STEPS</div>
                <div className="flex items-center justify-between">
                  {[1, 2, 3, 4, 5, 6].map((step) => {
                    const labels = ["MAIN", "HOLD (PRE)", "PREP", "EVAL", "BIKE", "HOLD (POST)"];
                    const isActive = step === getStepLabel(popupAction).step;
                    const isPast = step < getStepLabel(popupAction).step;
                    return (
                      <React.Fragment key={step}>
                        <div className="flex flex-col items-center">
                          <div
                            className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isActive
                                ? "bg-indigo-600 text-white"
                                : isPast
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 text-gray-400"
                            }`}
                          >
                            {step}
                          </div>
                          <span className="text-[8px] text-gray-500 mt-0.5">{labels[step-1]}</span>
                        </div>
                        {step < 6 && <div className="flex-1 h-0.5 mx-1 bg-gray-200" />}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Current</span>
                  <span className="font-medium text-gray-700">{getStepLabel(popupAction).current}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-gray-100 pt-1.5 text-xs">
                  <span className="text-gray-400">Next</span>
                  <span className="font-semibold text-indigo-600">{getStepLabel(popupAction).next}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-gray-100 pt-1.5 text-xs">
                  <span className="text-gray-400">Octonorm</span>
                  <span className="font-medium text-gray-700">
                    {rooms.find((r) => r.id === selectedParticipant.octonormId)?.name || "—"}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-gray-100 pt-1.5 text-xs">
                  <span className="text-gray-400">Trainer</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        trainerColors[selectedParticipant.trainer]?.bg || "bg-gray-400"
                      } text-white`}
                    >
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
                        : popupAction === "toBike"
                        ? "linear-gradient(135deg, #F97316, #EA580C)"
                        : "linear-gradient(135deg, #34D399, #10B981)",
                  }}
                >
                  {popupAction === "toComplete" ? "✅ Move to Hold (Post)" : popupAction === "toBike" ? "🚴 Move to Bike" : "→ Move"}
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
                        selectedTrainerForParticipant.trainer === trainer
                          ? `ring-2 ring-indigo-500 ${colors?.bg || "bg-gray-400"} text-white`
                          : `hover:${colors?.bg || "bg-gray-100"}`
                      }`}
                    >
                     <span className={selectedTrainerForParticipant.trainer === trainer ? "text-white" : "text-gray-700"}>
  {trainer}
  {(() => {
    const t = trainers.find(t => t.name === trainer);
    return t?.languages ? ` (${t.languages})` : '';
  })()}
</span>
                      {selectedTrainerForParticipant.trainer === trainer && (
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
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition flex items-center justify-between hover:${colors?.bg || "bg-gray-100"}`}
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