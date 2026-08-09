import React from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { ArrowLeft, Shield, CheckCircle, Award, Lock, Send, AlertCircle } from 'lucide-react';

interface Candidate {
  id: number;
  headline: string | null;
  bio: string | null;
  skills: string[];
  badges: string[];
  contributions: string[];
  availability_status: string;
  verified_at: string | null;
  institution_name: string | null;
}

interface CandidateDetailProps {
  candidate: Candidate;
  contactConsequenceNotice: string;
}

export default function CandidateDetail({ candidate, contactConsequenceNotice }: CandidateDetailProps) {
  return (
    <AppLayout>
      <Head title={`${candidate.headline || 'Candidate Profile'} - SATU Platform`} />

      <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-10 space-y-8 max-w-5xl mx-auto">
        {/* Navigation */}
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Talent Search
        </button>

        {/* Profile Card */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-8 space-y-8 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-700/60 pb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100">
                  {candidate.headline || 'Verified Student Candidate'}
                </h1>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold capitalize ${
                  candidate.availability_status === 'available'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-slate-900 text-slate-400 border border-slate-700'
                }`}>
                  {candidate.availability_status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Provenance Badge */}
              {candidate.institution_name && (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Verified Student at <strong className="text-slate-100">{candidate.institution_name}</strong></span>
                  {candidate.verified_at && (
                    <span className="text-xs text-slate-500">
                      (Verified {new Date(candidate.verified_at).toLocaleDateString()})
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="shrink-0">
              <button
                disabled
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600/50 text-slate-300 font-semibold text-xs cursor-not-allowed opacity-80 shadow-lg"
                title="Contact request requires active contact entitlement"
              >
                <Send className="w-4 h-4" /> Send Contact Request
              </button>
            </div>
          </div>

          {/* Contact Consequence Notice Banner */}
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-5 flex items-start gap-4">
            <Lock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">Recruiter Privacy Boundary</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {contactConsequenceNotice}
              </p>
            </div>
          </div>

          {/* Biography */}
          {candidate.bio && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">About Candidate</h3>
              <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/40 p-5 rounded-2xl border border-slate-700/40">
                {candidate.bio}
              </p>
            </div>
          )}

          {/* Skills */}
          {candidate.skills.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Verified Skills</h3>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map(skill => (
                  <span key={skill} className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-blue-950 text-blue-300 border border-blue-900/80">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Badges */}
          {candidate.badges.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Academic & Project Badges</h3>
              <div className="flex flex-wrap gap-2">
                {candidate.badges.map(badge => (
                  <span key={badge} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-amber-950 text-amber-300 border border-amber-900/80">
                    <Award className="w-4 h-4 text-amber-400" />
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Verified Contributions */}
          {candidate.contributions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Verified Contributions</h3>
              <ul className="space-y-2">
                {candidate.contributions.map((contrib, idx) => (
                  <li key={idx} className="text-xs text-slate-300 bg-slate-900/40 px-4 py-3 rounded-xl border border-slate-700/40 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                    {typeof contrib === 'string' ? contrib : JSON.stringify(contrib)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
