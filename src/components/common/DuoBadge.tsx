import React from 'react';
import { Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DuoBadge() {
  const navigate = useNavigate();
  return (
    <button 
      onClick={() => navigate('/duo')}
      className="p-2 rounded-xl glass border border-white/10 text-white/70 hover:text-white transition"
    >
      <Smartphone className="w-4 h-4" />
    </button>
  );
}
