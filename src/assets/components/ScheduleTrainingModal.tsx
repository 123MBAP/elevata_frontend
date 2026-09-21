import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Video,
  Users,
  Award,
  BookOpen,
  Plus,
  Trash2,
  Sparkles,
  Landmark,
  FileText
} from 'lucide-react';
import { Training, useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

interface ScheduleTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Training | null;
}

const AVAILABLE_SECTORS = [
  'All Sectors',
  'Retail & Wholesale',
  'Agriculture & Agribusiness',
  'Manufacturing & Processing',
  'Technology & ICT',
  'Logistics & Transport',
  'Hospitality & Tourism',
  'Construction & Real Estate',
  'Healthcare & Pharma',
  'Services & Consulting'
];

export default function ScheduleTrainingModal({
  isOpen,
  onClose,
  initialData
}: ScheduleTrainingModalProps) {
  const { user } = useAuth();
  const { opportunities, createTraining, updateTraining } = useApp();

  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(initialData?.time || '14:00 CAT');
  const [durationMinutes, setDurationMinutes] = useState(initialData?.durationMinutes || 60);
  const [speaker, setSpeaker] = useState(initialData?.speaker || user?.name || 'Chief Credit Officer');
  const [speakerRole, setSpeakerRole] = useState(initialData?.speakerRole || 'Head of SME Underwriting');
  const [speakerOrg, setSpeakerOrg] = useState(initialData?.speakerOrg || user?.institutionName || 'BPR Bank Rwanda');
  const [selectedSectors, setSelectedSectors] = useState<string[]>(
    initialData?.targetAudience && initialData.targetAudience.length > 0
      ? initialData.targetAudience
      : ['All Sectors']
  );
  const [maxCapacity, setMaxCapacity] = useState(initialData?.maxCapacity || 100);
  const [opportunityId, setOpportunityId] = useState(initialData?.opportunityId || '');
  const [curriculum, setCurriculum] = useState<string[]>(
    initialData?.curriculum && initialData.curriculum.length > 0
      ? initialData.curriculum
      : [
          'Overview of Bank Underwriting Standards & DSCR thresholds',
          'Preparing compliant cash flow projections & bank reconciliations',
          'Common credit dossier rejection triggers & remediation',
          'Live interactive Q&A and instant pre-eligibility review'
        ]
  );
  const [newModule, setNewModule] = useState('');
  const [hasCertificate, setHasCertificate] = useState(initialData ? initialData.hasCertificate : true);

  if (!isOpen) return null;

  const handleAddModule = () => {
    if (!newModule.trim()) return;
    setCurriculum([...curriculum, newModule.trim()]);
    setNewModule('');
  };

  const handleRemoveModule = (idx: number) => {
    setCurriculum(curriculum.filter((_, i) => i !== idx));
  };

  const toggleSector = (sec: string) => {
    if (sec === 'All Sectors') {
      setSelectedSectors(['All Sectors']);
      return;
    }
    const filtered = selectedSectors.filter(s => s !== 'All Sectors');
    if (filtered.includes(sec)) {
      const rem = filtered.filter(s => s !== sec);
      setSelectedSectors(rem.length === 0 ? ['All Sectors'] : rem);
    } else {
      setSelectedSectors([...filtered, sec]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const matchedOpp = opportunities.find(o => o.id === opportunityId);

    if (initialData) {
      updateTraining(initialData.id, {
        title,
        description,
        date,
        time,
        durationMinutes: Number(durationMinutes),
        speaker,
        speakerRole,
        speakerOrg,
        targetAudience: selectedSectors,
        maxCapacity: Number(maxCapacity),
        opportunityId: opportunityId || undefined,
        opportunityTitle: matchedOpp?.title,
        curriculum,
        hasCertificate
      });
    } else {
      createTraining({
        title,
        description,
        date,
        time,
        durationMinutes: Number(durationMinutes),
        speaker,
        speakerRole,
        speakerOrg,
        meetingLink: `https://elevata.live/rooms/tr-${Date.now().toString(36)}`,
        targetAudience: selectedSectors,
        opportunityId: opportunityId || undefined,
        opportunityTitle: matchedOpp?.title,
        curriculum,
        maxCapacity: Number(maxCapacity),
        status: 'scheduled'
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 p-6 text-white flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center space-x-3 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shadow-inner text-blue-300">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                {initialData ? 'Edit Masterclass Schedule' : 'Schedule Virtual Training Masterclass'}
              </h2>
              <p className="text-xs text-blue-200 mt-0.5">
                Deliver interactive capacity building, admit SMEs live, and issue accredited certificates.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {/* Masterclass Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Masterclass Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., SME Financial Modeling & Underwriting Compliance Masterclass"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Description & Objectives
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what participating SMEs will learn, key bankability principles covered, and expected takeaways..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          {/* Date, Time, Duration & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Session Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Start Time
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  placeholder="14:00 CAT"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Duration (Mins)
              </label>
              <select
                value={durationMinutes}
                onChange={e => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes (1 Hour)</option>
                <option value={90}>90 Minutes (1.5 Hours)</option>
                <option value={120}>120 Minutes (2 Hours)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Max Capacity
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="number"
                  min={10}
                  max={500}
                  value={maxCapacity}
                  onChange={e => setMaxCapacity(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Instructor & Institution Info */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Landmark className="w-4 h-4 text-blue-600" />
              <span>Instructor & Delivering Institution</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Speaker / Instructor Name</label>
                <input
                  type="text"
                  required
                  value={speaker}
                  onChange={e => setSpeaker(e.target.value)}
                  placeholder="e.g., Patrick Habimana"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Speaker Role / Title</label>
                <input
                  type="text"
                  value={speakerRole}
                  onChange={e => setSpeakerRole(e.target.value)}
                  placeholder="e.g., Head of Credit Underwriting"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Delivering Institution</label>
                <input
                  type="text"
                  value={speakerOrg}
                  onChange={e => setSpeakerOrg(e.target.value)}
                  placeholder="e.g., BPR Bank Rwanda"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* Associated Opportunity (Optional) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Linked Credit / Grant Opportunity (Optional)</span>
              <span className="text-[10px] text-slate-500 font-normal">Connects to a specific funding product</span>
            </label>
            <select
              value={opportunityId}
              onChange={e => setOpportunityId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- General Capacity Building (No specific product linked) --</option>
              {opportunities.map(opp => (
                <option key={opp.id} value={opp.id}>
                  {opp.title} ({opp.institution} - {opp.category})
                </option>
              ))}
            </select>
          </div>

          {/* Target Sectors */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Target SME Sectors
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SECTORS.map(sec => {
                const isSelected = selectedSectors.includes(sec);
                return (
                  <button
                    type="button"
                    key={sec}
                    onClick={() => toggleSector(sec)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {sec}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Curriculum & Key Syllabus Modules */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Curriculum Modules & Presentation Roadmap</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">Shown in virtual room & slides</span>
            </label>
            <div className="space-y-2 mb-3">
              {curriculum.map((mod, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span>{mod}</span>
                  </div>
                  {curriculum.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveModule(idx)}
                      className="p-1 text-slate-400 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newModule}
                onChange={e => setNewModule(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddModule();
                  }
                }}
                placeholder="Add next syllabus module or practical exercise..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddModule}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Accreditation Option */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-900">Award Official Accredited Certificate</h5>
                <p className="text-[11px] text-slate-600">
                  Admitted attendees who complete the masterclass automatically gain +12% Readiness Boost.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={hasCertificate}
                onChange={e => setHasCertificate(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Form Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center space-x-2 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>{initialData ? 'Save Changes' : 'Publish & Schedule Masterclass'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
