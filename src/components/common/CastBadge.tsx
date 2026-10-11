import React from 'react';
import { Cast } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CastBadge() {
  return (
    <button className="p-2 rounded-xl glass border border-white/10 text-white/70 hover:text-white transition">
      <Cast className="w-4 h-4" />
    </button>
  );
}
