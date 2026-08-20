// DigitalFlow.jsx – simplified: no trainerUpdates sent to backend
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Clock, Gamepad2, Hourglass, Settings, ClipboardList, Flag,
  Users, X, UserCog, Monitor, CheckSquare, Square, MousePointerClick, Bike,
  LogOut,
} from "lucide-react";
import { getSetup, updateParticipantOrder } from "../../services/api";  // adjust path
import { useNavigate } from "react-router-dom";

// ---- Color palette (10 distinct colors) ----
const colorPalette = [
  { from: "#8B5CF6", to: "#7C3AED" },  // purple
  { from: "#F43F5E", to: "#E11D48" },  // rose
  { from: "#0EA5E9", to: "#0284C7" },  // sky
  { from: "#F97316", to: "#EA580C" },  // orange
  { from: "#34D399", to: "#10B981" },  // emerald
  { from: "#FBBF24", to: "#F59E0B" },  // amber
  { from: "#EC4899", to: "#DB2777" },  // pink
  { from: "#14B8A6", to: "#0D9488" },  // teal
  { from: "#6366F1", to: "#4F46E5" },  // indigo
  { from: "#6B7280", to: "#4B5563" },  // gray
];

const borderColors = [
  "border-purple-400", "border-rose-400", "border-sky-400",
  "border-orange-400", "border-emerald-400", "border-amber-400",
  "border-pink-400", "border-teal-400", "border-indigo-400",
  "border-gray-400"
];
const bgClasses = [
  "bg-purple-500", "bg-rose-500", "bg-sky-500",
  "bg-orange-500", "bg-emerald-500", "bg-amber-500",
  "bg-pink-500", "bg-teal-500", "bg-indigo-500",
  "bg-gray-500"
];

export default function DigitalFlow() {
  const [participants, setParticipants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [setup, setSetup] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
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

  const navigate = useNavigate();

  // ---- Fetch ----
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getSetup();
        if (response.data.success) {
          const { setup, trainers, rooms, participants: dbParticipants, rounds, timeSlots: dbTimeSlots } = response.data.data;
          setSetup(setup);
          setTrainers(trainers);
          setRounds(rounds);
          setTimeSlots(dbTimeSlots || []);
          setRooms(rooms.map(r => ({
            id: r.id,
            name: r.name,
            bikeName: r.vehicle_name || null,
            trainerId: r.trainer_id || null
          })));
          setParticipants(dbParticipants.map(p => ({
            id: String(p.id),
            name: p.name,
            empId: p.employee_id,
            role: p.role || "",
            language: p.language || "",
            profileImage: p.profile_image ? `http://localhost:5000${p.profile_image}` : null,
            timer: p.timer || null,
            booth: p.booth || null,
            evaluator: p.evaluator || null,
            trainer: p.trainer_name || "",
            trainerId: p.trainer_id,
            octonormId: p.room_id,
            stage: p.stage || "main",
            dbId: p.id,
          })));
        } else setError("Failed to load data");
      } catch (err) { setError(err.message); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // ---- Timer ----
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      setParticipants(prev => prev.map(p => p.timer > 0 ? { ...p, timer: p.timer - 1 } : p));
    }, 1000);
    return () => clearInterval(interval);
  }, [loading]);

  // ---- Helpers ----
  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };
  const getStageCount = (stageKey) => participants.filter(p => p.stage === stageKey).length;

  // ---- Trainer colors ----
  const trainerColors = {};
  trainers.forEach((t) => {
    const colors = [
      "red-500", "green-500", "purple-500", "pink-500",
      "indigo-500", "teal-500", "orange-500", "gray-500",
      "rose-500", "sky-500"
    ];
    const idx = trainers.findIndex(t2 => t2.id === t.id) % colors.length;
    trainerColors[t.name] = { bg: `bg-${colors[idx]}` };
  });
  const trainerNames = trainers.map(t => t.name);

  // ---- Setup data ----
  const setupData = {
    preparation_booths: setup?.preparation_booths || 5,
    preparation_time_per_case: setup?.preparation_time || 5,
    no_of_evaluators: 5,
    time_per_evaluation_round: 10,
    time_per_bike_round: 10,
  };

  // ---- Build dynamic step sequence ----
  const getEnabledSteps = () => {
    const steps = [];
    steps.push({ key: "main", label: "MAIN" });
    if (setup?.hold_area_pre) steps.push({ key: "holding", label: "HOLD (PRE)" });
    if (setup?.preparation_enabled) steps.push({ key: "prep", label: "PREP" });

    rounds.forEach((r) => {
      steps.push({
        key: `round_${r.id}`,
        label: r.name,
        isRound: true,
        holdArea: r.hold_area === 1,
        time: r.time_minutes,
        roundId: r.id,
      });
      if (r.hold_area === 1) {
        steps.push({
          key: `hold_after_round_${r.id}`,
          label: `Hold (after ${r.name})`,
          isHoldAfterRound: true,
          roundId: r.id,
        });
      }
    });

    if (setup?.hold_area_post) steps.push({ key: "completed", label: "HOLD (POST)" });
    return steps;
  };

  const enabledSteps = getEnabledSteps();
  const stepKeys = enabledSteps.map(s => s.key);

  const getNextStage = (currentKey) => {
    const idx = stepKeys.indexOf(currentKey);
    if (idx === -1 || idx === stepKeys.length - 1) return null;
    return stepKeys[idx + 1];
  };

  // ---- Stats ----
  const stats = enabledSteps.map((step, idx) => {
    const iconMap = { main: Gamepad2, holding: Hourglass, prep: Settings, completed: Flag };
    let Icon = iconMap[step.key];
    if (step.isRound) {
      const roundIndex = rounds.findIndex(r => r.id === step.roundId);
      Icon = roundIndex === 0 ? ClipboardList : Monitor;
    }
    if (step.isHoldAfterRound) {
      Icon = Hourglass;
    }
    if (!Icon) Icon = Gamepad2;
    const colors = colorPalette[idx % colorPalette.length];
    return {
      key: step.key,
      label: step.label,
      value: getStageCount(step.key),
      icon: Icon,
      from: colors.from,
      to: colors.to,
    };
  });

  // ---- Save order to backend (ONLY room mapping) ----
  const saveOrder = async (participantsList) => {
    if (!setup?.id) return;
    const roomsMap = {};
    participantsList.forEach(p => {
      const roomId = p.octonormId;
      if (!roomsMap[roomId]) roomsMap[roomId] = [];
      roomsMap[roomId].push(p.dbId);
    });
    try {
      await updateParticipantOrder(setup.id, roomsMap);
    } catch (err) {
      console.error('Failed to save order:', err);
    }
  };

  // ---- Handlers ----
  const handleChangeTrainerForParticipant = (participant) => {
    setSelectedTrainerForParticipant(participant);
    setShowChangeTrainer(true);
  };

  // ✅ UPDATED: move participant to trainer's room, last position
  const handleSelectTrainer = async (trainerIndex) => {
    if (!selectedTrainerForParticipant) return;

    const trainerName = trainerNames[trainerIndex];
    const trainerId = trainers.find(t => t.name === trainerName)?.id;
    if (!trainerId) return;

    // Find the room that has this trainer as default
    const targetRoom = rooms.find(r => r.trainerId === trainerId);
    const targetRoomId = targetRoom?.id;

    setParticipants(prev => {
      const arr = [...prev];
      const participantIndex = arr.findIndex(p => p.id === selectedTrainerForParticipant.id);
      if (participantIndex === -1) return prev;

      const participant = arr[participantIndex];
      const currentRoomId = participant.octonormId;

      // If already in the target room, just update trainer and keep position
      if (targetRoomId && targetRoomId === currentRoomId) {
        arr[participantIndex] = { ...participant, trainer: trainerName, trainerId };
        saveOrder(arr);
        return arr;
      }

      // Remove participant from current position
      const [removed] = arr.splice(participantIndex, 1);

      // If no target room found, keep current room
      const newRoomId = targetRoomId || currentRoomId;
      const updatedParticipant = {
        ...removed,
        octonormId: newRoomId,
        trainer: trainerName,
        trainerId,
      };

      // Insert at the end of the target room's list
      let insertIndex = arr.length;
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].octonormId === newRoomId) {
          insertIndex = i + 1;
          break;
        }
      }
      // If no participants in target room, insert at the first occurrence of that room
      if (insertIndex === arr.length) {
        const firstIndex = arr.findIndex(p => p.octonormId === newRoomId);
        if (firstIndex !== -1) {
          insertIndex = firstIndex;
        }
      }
      arr.splice(insertIndex, 0, updatedParticipant);

      saveOrder(arr);
      return arr;
    });

    setShowChangeTrainer(false);
    setSelectedTrainerForParticipant(null);
  };

  const openPopup = (participant) => {
    setSelectedParticipant(participant);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedParticipant(null);
    setPopupAction("");
  };

  // ---- Move participant (single) ----
  const handleMove = () => {
    if (!selectedParticipant) return;
    const targetKey = getNextStage(selectedParticipant.stage);
    if (!targetKey) { closePopup(); return; }

    setParticipants(prev => {
      const updates = { stage: targetKey };
      if (targetKey === "prep") {
        const boothNumber = (prev.filter(p => p.stage === "prep").length % setupData.preparation_booths) + 1;
        updates.booth = boothNumber;
        updates.timer = setupData.preparation_time_per_case * 60;
      } else {
        updates.booth = null;
        updates.evaluator = null;
      }
      const targetStep = enabledSteps.find(s => s.key === targetKey);
      if (targetStep?.isRound) {
        const round = rounds.find(r => r.id === targetStep.roundId);
        updates.timer = round ? round.time_minutes * 60 : 10 * 60;
      } else if (targetStep?.isHoldAfterRound || targetKey === "completed") {
        updates.timer = null;
      }
      const newList = prev.map(p =>
        p.id === selectedParticipant.id ? { ...p, ...updates } : p
      );
      saveOrder(newList);
      return newList;
    });
    closePopup();
  };

  // ---- Multi-select ----
  const toggleSelectMode = () => {
    setSelectMode(m => !m);
    setSelectedIds(new Set());
  };

  const toggleSelectParticipant = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkAdvance = () => {
    setParticipants(prev => {
      let prepCounter = prev.filter(p => p.stage === "prep").length;
      const newList = prev.map(p => {
        if (!selectedIds.has(p.id)) return p;
        const targetKey = getNextStage(p.stage);
        if (!targetKey) return p;
        const updates = { stage: targetKey };
        if (targetKey === "prep") {
          const boothNumber = (prepCounter % setupData.preparation_booths) + 1;
          prepCounter++;
          updates.booth = boothNumber;
          updates.timer = setupData.preparation_time_per_case * 60;
        } else {
          updates.booth = null;
          updates.evaluator = null;
        }
        const targetStep = enabledSteps.find(s => s.key === targetKey);
        if (targetStep?.isRound) {
          const round = rounds.find(r => r.id === targetStep.roundId);
          updates.timer = round ? round.time_minutes * 60 : 10 * 60;
        } else if (targetStep?.isHoldAfterRound || targetKey === "completed") {
          updates.timer = null;
        }
        return { ...p, ...updates };
      });
      saveOrder(newList);
      return newList;
    });
    clearSelection();
  };

  const handleBulkSelectTrainer = (trainerIndex) => {
    const trainerName = trainerNames[trainerIndex];
    const trainerId = trainers.find(t => t.name === trainerName)?.id;
    setParticipants(prev => {
      const newList = prev.map(p =>
        selectedIds.has(p.id) ? { ...p, trainer: trainerName, trainerId } : p
      );
      saveOrder(newList);
      return newList;
    });
    setShowBulkTrainer(false);
    clearSelection();
  };

  // ---- Participant click ----
  const handleParticipantClick = (p) => {
    if (selectMode) { toggleSelectParticipant(p.id); return; }
    if (dragOccurredRef.current) { dragOccurredRef.current = false; return; }
    openPopup(p);
  };

  // ---- Drag & drop ----
  const handleDragStart = (e, participant) => {
    if (selectMode) { e.preventDefault(); return; }
    setDraggedId(participant.id);
    dragOccurredRef.current = false;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", participant.id);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverRoomId(null);
  };

  const handleCardDragOver = (e) => e.preventDefault();

  // -------- CARD-TO-CARD DROP (swap or move) --------
  const handleCardDrop = (e, targetParticipant) => {
    e.preventDefault();
    e.stopPropagation();
    dragOccurredRef.current = true;
    const sourceId = draggedId;
    setDragOverRoomId(null);
    setDraggedId(null);
    if (!sourceId || sourceId === targetParticipant.id) return;

    setParticipants(prev => {
      const arr = [...prev];
      const fromIndex = arr.findIndex(p => p.id === sourceId);
      const toIndex = arr.findIndex(p => p.id === targetParticipant.id);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const sourceRoom = arr[fromIndex].octonormId;
      const targetRoom = arr[toIndex].octonormId;
      const dragged = arr[fromIndex];

      if (sourceRoom === targetRoom) {
        [arr[fromIndex], arr[toIndex]] = [arr[toIndex], arr[fromIndex]];
      } else {
        const targetRoomData = rooms.find(r => r.id === targetRoom);
        const newTrainerId = targetRoomData?.trainerId || null;
        const newTrainerName = newTrainerId ? trainers.find(t => t.id === newTrainerId)?.name : '';
        const updatedDragged = {
          ...dragged,
          octonormId: targetRoom,
          trainerId: newTrainerId,
          trainer: newTrainerName || '',
        };
        arr.splice(fromIndex, 1);
        const insertIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
        arr.splice(insertIndex, 0, updatedDragged);
      }

      saveOrder(arr);
      return arr;
    });
  };

  // -------- CELL DROP (drop into empty cell) --------
  const handleCellDrop = (e, roomId, rowIndex) => {
    e.preventDefault();
    e.stopPropagation();
    dragOccurredRef.current = true;
    const sourceId = draggedId;
    setDragOverRoomId(null);
    setDraggedId(null);
    if (!sourceId) return;

    setParticipants(prev => {
      const arr = [...prev];
      const fromIndex = arr.findIndex(p => p.id === sourceId);
      if (fromIndex === -1) return prev;
      const [item] = arr.splice(fromIndex, 1);

      let updatedItem = { ...item, octonormId: roomId };

      const targetRoomData = rooms.find(r => r.id === roomId);
      const newTrainerId = targetRoomData?.trainerId || null;
      const newTrainerName = newTrainerId ? trainers.find(t => t.id === newTrainerId)?.name : '';
      updatedItem.trainerId = newTrainerId;
      updatedItem.trainer = newTrainerName || '';

      const roomParticipants = arr.filter(p => p.octonormId === roomId);
      let globalInsertIndex = arr.findIndex(p => p.octonormId === roomId);
      if (globalInsertIndex === -1) {
        globalInsertIndex = arr.length;
      } else {
        let idx = 0;
        while (idx < arr.length && arr[idx].octonormId !== roomId) idx++;
        globalInsertIndex = idx + Math.min(rowIndex, roomParticipants.length);
      }
      arr.splice(globalInsertIndex, 0, updatedItem);

      saveOrder(arr);
      return arr;
    });
  };

  // ---- Logout ----
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
    navigate("/login");
  };

  const getStepLabels = (currentKey) => {
    const idx = stepKeys.indexOf(currentKey);
    if (idx === -1) return { current: "", next: "" };
    return {
      current: enabledSteps[idx]?.label || "",
      next: idx < stepKeys.length - 1 ? enabledSteps[idx+1]?.label || "" : "",
    };
  };

  // ---- UI Rendering ----
  const getParticipantsByRoom = () => {
    const map = {};
    rooms.forEach(room => { map[room.id] = participants.filter(p => p.octonormId === room.id); });
    return map;
  };

  const roomsData = getParticipantsByRoom();
  const maxRows = Math.max(0, ...Object.values(roomsData).map(arr => arr.length));

  let timeLabels = timeSlots.slice(0, maxRows).map(slot => slot.time);
  if (timeLabels.length < maxRows) {
    const baseTime = new Date();
    baseTime.setHours(9, 0, 0, 0);
    for (let i = timeLabels.length; i < maxRows; i++) {
      const next = new Date(baseTime.getTime() + i * 30 * 60000);
      const hours = next.getHours();
      const minutes = next.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const h12 = hours % 12 || 12;
      timeLabels.push(`${String(h12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${ampm}`);
    }
  }

  const TrainerLegend = () => {
    const uniqueTrainers = [...new Set(participants.map(p => p.trainer))];
    return (
      <div className="flex flex-wrap items-center gap-2">
        {uniqueTrainers.map(trainer => (
          <div key={trainer} className="flex items-center gap-1">
            <span className={`h-2.5 w-2.5 rounded-full ${trainerColors[trainer]?.bg || "bg-gray-400"}`} />
            <span className="text-[10px] font-medium text-gray-700">{trainer}</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-4 font-sans pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Digital Flow</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
      {/* Top stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-3">
        <div className="relative col-span-2 sm:col-span-1 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B0E1F] to-[#171B34] p-4 text-white shadow-lg">
          <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1.5px)", backgroundSize: "10px 10px" }} />
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
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${selectMode ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          {selectMode ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
          {selectMode ? "Exit Select Mode" : "Select Multiple"}
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-[80px_repeat(10,1fr)] gap-1">
        <div className="rounded-t-lg bg-gray-700 py-1.5 px-2 text-center font-bold text-white">Time</div>
        {rooms.map(room => (
          <div key={room.id} className="rounded-t-lg bg-gray-700 py-1.5 px-2 text-center flex flex-col items-center leading-tight">
            {room.bikeName && <span className="text-yellow-400 font-bold text-[10px] flex items-center gap-0.5"><Bike className="h-3 w-3" />{room.bikeName}</span>}
            <span className="text-white font-bold text-xs">{room.name.replace("Octonorm ", "O")}</span>
          </div>
        ))}

        {Array.from({ length: maxRows }).map((_, rowIdx) => (
          <div key={`row-${rowIdx}`} className="contents">
            <div className="bg-gray-100 border border-gray-200 min-h-[80px] flex items-center justify-center">
              <span className="text-xs font-semibold">{timeLabels[rowIdx] || ""}</span>
            </div>
            {rooms.map(room => {
              const participant = roomsData[room.id]?.[rowIdx] || null;
              return (
                <div
                  key={`${room.id}-${rowIdx}`}
                  className="p-1 border border-gray-200 min-h-[80px] relative transition-colors"
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverRoomId(room.id); }}
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
                      className={`group relative flex ${selectMode ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"} flex-col items-center rounded-lg bg-white p-1 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${(() => {
                        const idx = enabledSteps.findIndex(s => s.key === participant.stage);
                        const border = idx !== -1 ? borderColors[idx % borderColors.length] : "border-gray-400";
                        return `border-6 ${border}`;
                      })()} ${draggedId === participant.id ? "opacity-30" : ""} ${selectedIds.has(participant.id) ? "ring-4 ring-indigo-500 ring-offset-1" : ""}`}
                    >
                      {selectMode && <div className={`absolute -top-1.5 -left-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white shadow-sm ${selectedIds.has(participant.id) ? "bg-indigo-600" : "bg-gray-300"}`}>{selectedIds.has(participant.id) && <CheckSquare className="h-2.5 w-2.5 text-white" />}</div>}
                      <div className="relative">
                        {participant.profileImage ? (
                          <img src={participant.profileImage} alt={participant.name} className="h-10 w-10 rounded-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = `<div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">${participant.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}</div>`; }} />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">{participant.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}</div>
                        )}
                        {participant.timer > 0 && <div className="absolute -bottom-0.5 -right-0.5 rounded-full border border-white bg-red-500 p-0.5 shadow-sm"><Clock className="h-2 w-2 text-white" /></div>}
                      </div>
                      <div className="mt-0.5 w-full truncate text-center text-[10px] font-semibold leading-tight text-black">{participant.name}</div>
                      <div className="mt-0.5 w-full truncate text-center text-[10px] font-semibold leading-tight text-black">({participant.role} · {participant.language || '—'})</div>
                      <div className="mt-0.5 w-full flex justify-center">
                        <span className={`px-1 py-0.5 rounded text-[9px] font-semibold ${trainerColors[participant.trainer]?.bg || "bg-gray-400"} text-white`}>{participant.trainer}</span>
                      </div>
                      {participant.timer > 0 && <div className={`mt-0.5 text-[10px] font-bold ${participant.timer < 60 ? "animate-pulse text-red-500" : "text-blue-500"}`}>{formatTime(participant.timer)}</div>}
                    </div>
                  ) : <div className="text-center text-[8px] text-gray-300 py-4">—</div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Trainer Legend */}
      <div className="mt-3 rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-sm">
        <div className="flex items-center gap-2"><span className="text-[10px] font-semibold text-gray-400">TRAINERS:</span><TrainerLegend /></div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 text-[10px]">
          <span className="font-semibold text-gray-400">LEGEND:</span>
          {enabledSteps.map((step, idx) => (
            <LegendDot key={step.key} color={bgClasses[idx % bgClasses.length]} label={step.label} />
          ))}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <Clock className="h-3 w-3 text-red-500" /><span>Timer active</span>
          <span className="text-gray-300">|</span>
          <span>{selectMode ? "💡 Tap cards to select, then use the bar below for bulk actions" : "💡 Click a card to advance it · Drag a card to move/reorder it · Use \"Select Multiple\" for bulk actions"}</span>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-gray-900 px-4 py-2.5 text-white shadow-2xl animate-fadeIn">
          <span className="text-xs font-bold whitespace-nowrap">{selectedIds.size} selected</span>
          <div className="h-4 w-px bg-white/20" />
          <button onClick={handleBulkAdvance} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold hover:bg-indigo-500 transition whitespace-nowrap">→ Move Forward</button>
          <button onClick={() => setShowBulkTrainer(true)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold hover:bg-emerald-500 transition whitespace-nowrap">Change Trainer</button>
          <button onClick={clearSelection} className="rounded-lg bg-gray-700 px-3 py-1.5 text-[11px] font-semibold hover:bg-gray-600 transition whitespace-nowrap">Clear</button>
        </div>
      )}

      {/* Popup Modal */}
      {showPopup && selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="mx-4 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl animate-slideUp">
            {(() => {
              const idx = enabledSteps.findIndex(s => s.key === selectedParticipant.stage);
              const colors = idx !== -1 ? colorPalette[idx % colorPalette.length] : { from: "#6B7280", to: "#4B5563" };
              return (
                <div className="px-5 py-3.5" style={{ backgroundImage: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {selectedParticipant.profileImage ? (
                        <img src={selectedParticipant.profileImage} alt={selectedParticipant.name} className="h-14 w-14 rounded-full object-cover ring-4 ring-white/30 shadow-lg" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = `<div class="h-14 w-14 rounded-full bg-gray-400 flex items-center justify-center text-lg font-bold text-white shadow-lg">${selectedParticipant.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}</div>`; }} />
                      ) : (
                        <div className="h-14 w-14 rounded-full bg-gray-400 flex items-center justify-center text-lg font-bold text-white shadow-lg">{selectedParticipant.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-white">{selectedParticipant.name}</h3>
                      <p className="text-xs text-white/70">{selectedParticipant.empId}</p>
                      <p className="text-[10px] text-white/50">{selectedParticipant.role} · {selectedParticipant.language || '—'}</p>
                    </div>
                    <button onClick={closePopup} className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
                  </div>
                </div>
              );
            })()}

            <div className="p-4">
              {/* Flow steps */}
              <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="text-[10px] font-semibold text-gray-400 mb-2">FLOW STEPS</div>
                <div className="flex items-center justify-between">
                  {enabledSteps.map((step, idx) => {
                    const isActive = step.key === selectedParticipant.stage;
                    const isPast = stepKeys.indexOf(step.key) < stepKeys.indexOf(selectedParticipant.stage);
                    return (
                      <React.Fragment key={step.key}>
                        <div className="flex flex-col items-center">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isActive ? "bg-indigo-600 text-white" : isPast ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                            {idx + 1}
                          </div>
                          <span className="text-[8px] text-gray-500 mt-0.5">{step.label}</span>
                          {step.isRound && step.holdArea && <span className="text-[6px] text-amber-500 mt-0.5">(Hold)</span>}
                        </div>
                        {idx < enabledSteps.length - 1 && <div className="flex-1 h-0.5 mx-1 bg-gray-200" />}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Current</span>
                  <span className="font-medium text-gray-700">{enabledSteps.find(s => s.key === selectedParticipant.stage)?.label || selectedParticipant.stage}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-gray-100 pt-1.5 text-xs">
                  <span className="text-gray-400">Next</span>
                  <span className="font-semibold text-indigo-600">
                    {(() => {
                      const nextKey = getNextStage(selectedParticipant.stage);
                      return nextKey ? enabledSteps.find(s => s.key === nextKey)?.label || nextKey : '—';
                    })()}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-gray-100 pt-1.5 text-xs">
                  <span className="text-gray-400">Octonorm</span>
                  <span className="font-medium text-gray-700">{rooms.find(r => r.id === selectedParticipant.octonormId)?.name || '—'}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-gray-100 pt-1.5 text-xs">
                  <span className="text-gray-400">Trainer</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${trainerColors[selectedParticipant.trainer]?.bg || "bg-gray-400"} text-white`}>
                      {selectedParticipant.trainer}
                      {(() => {
                        const t = trainers.find(tr => tr.id === selectedParticipant.trainerId);
                        return t?.languages ? ` (${t.languages})` : '';
                      })()}
                    </span>
                    <button onClick={() => handleChangeTrainerForParticipant(selectedParticipant)} className="text-[9px] font-medium text-indigo-600 hover:text-indigo-800 transition">Change</button>
                  </div>
                </div>
                {rounds.some(r => r.hold_area === 1) && (
                  <div className="mt-1.5 flex items-center justify-between border-t border-gray-100 pt-1.5 text-xs">
                    <span className="text-gray-400">Round Holds</span>
                    <span className="font-medium text-gray-700">{rounds.filter(r => r.hold_area === 1).map(r => r.name).join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button onClick={closePopup} className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-200">Cancel</button>
                <button onClick={handleMove} className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg transition hover:shadow-xl" style={{
                  backgroundImage: `linear-gradient(135deg, ${(() => {
                    const idx = enabledSteps.findIndex(s => s.key === selectedParticipant.stage);
                    const colors = idx !== -1 ? colorPalette[idx % colorPalette.length] : { from: "#6B7280", to: "#4B5563" };
                    return `${colors.from}, ${colors.to}`;
                  })()})`
                }}>
                  → Move to Next
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
                <div className="flex items-center gap-2"><UserCog className="h-5 w-5 text-white" /><span className="text-sm font-bold text-white">Change Trainer</span></div>
                <button onClick={() => { setShowChangeTrainer(false); setSelectedTrainerForParticipant(null); }} className="text-white/70 hover:text-white transition"><X className="h-4 w-4" /></button>
              </div>
              <p className="text-xs text-white/70 mt-1">{selectedTrainerForParticipant.name} - Current: {selectedTrainerForParticipant.trainer}</p>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto">
              <div className="space-y-1">
                {trainerNames.map((trainer, idx) => {
                  const colors = trainerColors[trainer];
                  return (
                    <button key={idx} onClick={() => handleSelectTrainer(idx)} className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition flex items-center justify-between ${selectedTrainerForParticipant.trainer === trainer ? `ring-2 ring-indigo-500 ${colors?.bg || "bg-gray-400"} text-white` : `hover:${colors?.bg || "bg-gray-100"}`}`}>
                      <span className={selectedTrainerForParticipant.trainer === trainer ? "text-white" : "text-gray-700"}>{trainer}{(() => { const t = trainers.find(tr => tr.name === trainer); return t?.languages ? ` (${t.languages})` : ''; })()}</span>
                      {selectedTrainerForParticipant.trainer === trainer && <span className="text-[10px] font-bold text-white">✓ Current</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-gray-100 px-4 py-3">
              <button onClick={() => { setShowChangeTrainer(false); setSelectedTrainerForParticipant(null); }} className="w-full rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-200">Cancel</button>
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
                <div className="flex items-center gap-2"><UserCog className="h-5 w-5 text-white" /><span className="text-sm font-bold text-white">Change Trainer (Bulk)</span></div>
                <button onClick={() => setShowBulkTrainer(false)} className="text-white/70 hover:text-white transition"><X className="h-4 w-4" /></button>
              </div>
              <p className="text-xs text-white/70 mt-1">Applying to {selectedIds.size} selected participant{selectedIds.size > 1 ? "s" : ""}</p>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto">
              <div className="space-y-1">
                {trainerNames.map((trainer, idx) => {
                  const colors = trainerColors[trainer];
                  return (
                    <button key={idx} onClick={() => handleBulkSelectTrainer(idx)} className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition flex items-center justify-between hover:${colors?.bg || "bg-gray-100"}`}>
                      <span className="text-gray-700">{trainer}{(() => { const t = trainers.find(tr => tr.name === trainer); return t?.languages ? ` (${t.languages})` : ''; })()}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-gray-100 px-4 py-3">
              <button onClick={() => setShowBulkTrainer(false)} className="w-full rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-200">Cancel</button>
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