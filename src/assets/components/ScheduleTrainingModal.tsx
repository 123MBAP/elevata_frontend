import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import logo from '../images/elevata_logo.png';
import { Training, useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export interface ScheduleTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<Training> | null;
  onSuccess?: (title: string) => void;
}

export default function ScheduleTrainingModal({
  isOpen,
  onClose,
  initialData,
  onSuccess
}: ScheduleTrainingModalProps) {
  const { user } = useAuth();
  const { createTraining, updateTraining } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [speakerOrg, setSpeakerOrg] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [targetAudience, setTargetAudience] = useState<string[]>(['All Sectors']);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '');
      setDescription(initialData?.description || '');
      setSpeaker(
        initialData?.speaker ||
        user?.financialInstitution?.representativeName ||
        user?.business?.ownerName ||
        'Chief Credit Officer'
      );
      setSpeakerOrg(
        initialData?.speakerOrg ||
        user?.financialInstitution?.institutionName ||
        user?.business?.businessName ||
        'BPR Bank Rwanda'
      );
      setDate(initialData?.date || new Date().toISOString().split('T')[0]);
      setTime(initialData?.time || '10:00 AM - 12:30 PM');
      setMeetingLink(initialData?.meetingLink || 'https://meet.elevata.rw/live-capacity');
      setTargetAudience(
        initialData?.targetAudience && initialData.targetAudience.length > 0
          ? initialData.targetAudience
          : ['All Sectors']
      );
    }
  }, [isOpen, initialData, user]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !speaker.trim() || !date.trim()) return;

    if (initialData && initialData.id) {
      updateTraining(initialData.id, {
        title,
        description,
        date,
        time,
        speaker,
        speakerOrg,
        meetingLink,
        targetAudience
      });
    } else {
      createTraining({
        title,
        description,
        date,
        time,
        speaker,
        speakerOrg,
        meetingLink,
        targetAudience,
        opportunityId: initialData?.opportunityId,
        opportunityTitle: initialData?.opportunityTitle,
        durationMinutes: initialData?.durationMinutes || 60,
        status: 'scheduled'
      });
    }

    if (onSuccess) {
      onSuccess(title);
    }
    onClose();
  };

  const isEditing = Boolean(initialData && initialData.id);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 overflow-y-auto font-sans">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-[10px] bg-white border border-[#e0e0e0] shadow-[0_4px_24px_rgba(0,0,0,0.12)] overflow-hidden animate-in zoom-in-95 duration-150 my-8"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e0e0e0] bg-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="Elevata" className="h-7 w-7 object-contain" />
            <div>
              <h3 className="text-sm font-bold text-[#181818]">
                {isEditing ? 'Edit Virtual Capacity Session' : 'Schedule Virtual Capacity Session'}
              </h3>
              <p className="text-[11px] text-[#5e5e5e] mt-0.5">
                Addressing SME eligibility matching gaps
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#5e5e5e] hover:text-[#181818] hover:bg-[#f3f2f0] rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form Fields */}
        <div className="p-6 space-y-4 text-xs bg-white">
          <div>
            <label className="mb-1 block text-[13px] font-medium text-[#181818]">
              Training Title
            </label>
            <input
              type="text"
              placeholder="e.g. Masterclass: Preparing Tax Clearance & Financials"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-medium text-[#181818]">
              Speaker / Host
            </label>
            <input
              type="text"
              placeholder="e.g. Dr. Agnes Kalibata"
              value={speaker}
              onChange={e => setSpeaker(e.target.value)}
              className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="mb-1 block text-[13px] font-medium text-[#181818]">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] font-mono text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-medium text-[#181818]">
                Time
              </label>
              <input
                type="text"
                placeholder="10:00 AM - 12:30 PM"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-medium text-[#181818]">
              Meeting Link
            </label>
            <input
              type="text"
              value={meetingLink}
              onChange={e => setMeetingLink(e.target.value)}
              className="h-10 w-full rounded-[4px] border border-[#666666] bg-white px-3 text-[14px] font-mono text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-medium text-[#181818]">
              Description Abstract
            </label>
            <textarea
              placeholder="Describe workshop goals..."
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full rounded-[4px] border border-[#666666] bg-white p-3 text-[13px] text-[#181818] outline-none transition-colors focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] leading-relaxed"
              required
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#f3f2f0] border-t border-[#e0e0e0] flex justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 items-center justify-center rounded-full border border-[#666666] bg-white px-5 text-[14px] font-semibold text-[#181818] transition-colors hover:bg-[#f3f2f0]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex h-10 items-center justify-center rounded-full bg-[#0a66c2] px-6 text-[14px] font-bold text-white transition-colors hover:bg-[#004182] shadow-xs border-none"
          >
            {isEditing ? 'Save Changes' : 'Schedule Session'}
          </button>
        </div>
      </form>
    </div>
  );
}
