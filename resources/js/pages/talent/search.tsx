import { Head, router } from '@inertiajs/react';
import { AlertTriangle, Award, Briefcase, CheckCircle, ChevronRight, Filter, Search, Shield, UserCheck, X } from 'lucide-react';
import React, { useState, useTransition } from 'react';
import AppLayout from '@/layouts/app-layout';

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

interface Institution {
  id: number;
  name: string;
}

interface TalentSearchProps {
  candidates: {
    data: Candidate[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
  };
  filters: {
    query: string;
    skills: string[];
    badges: string[];
    availability: string;
    institution_id: string;
  };
  entitlement: {
    has_entitlement: boolean;
    status: string;
    expires_at: string | null;
  };
  institutions: Institution[];
}

export default function TalentSearch({ candidates, filters, entitlement, institutions }: TalentSearchProps) {
  const [searchQuery, setSearchQuery] = useState(filters.query || '');
  const [selectedAvailability, setSelectedAvailability] = useState(filters.availability || '');
  const [selectedInstitution, setSelectedInstitution] = useState(filters.institution_id || '');
  const [skillInput, setSkillInput] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(filters.skills || []);
  const [isPending, startTransition] = useTransition();

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = () => {
    startTransition(() => {
      router.get(
        '/recruiter/talent/search',
        {
          query: searchQuery || undefined,
          skills: selectedSkills.length > 0 ? selectedSkills.join(',') : undefined,
          availability: selectedAvailability || undefined,
          institution_id: selectedInstitution || undefined,
        },
        { preserveState: true, replace: true }
      );
    });
  };

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();

    if (trimmed && !selectedSkills.includes(trimmed)) {
      const updated = [...selectedSkills, trimmed];

      setSelectedSkills(updated);
    }

    setSkillInput('');
  };

  const removeSkill = (skillToRemove: string) => {
    const updated = selectedSkills.filter(s => s !== skillToRemove);
    setSelectedSkills(updated);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedAvailability('');
    setSelectedInstitution('');
    setSelectedSkills([]);
    router.get('/recruiter/talent/search', {}, { preserveState: true, replace: true });
  };

  return (
    <AppLayout>
      <Head title="Talent Search - SATU Platform" />

      <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Talent Search
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                <Shield className="w-3.5 h-3.5 text-emerald-400" /> Verified Safe Projection
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Search verified student portfolios with strict recruiter-safe privacy projections.
            </p>
          </div>

          {entitlement.has_entitlement && (
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-4 py-2 rounded-xl text-xs font-medium text-slate-300">
              <UserCheck className="w-4 h-4 text-blue-400" />
              <span>Entitlement Active</span>
              {entitlement.expires_at && (
                <span className="text-slate-500">
                  (Expires {new Date(entitlement.expires_at).toLocaleDateString()})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Entitlement Alert Banner if Entitlement is Missing or Expired */}
        {!entitlement.has_entitlement && (
          <div role="alert" className="bg-amber-950/60 border border-amber-800/60 text-amber-200 rounded-2xl p-5 flex items-start gap-4 shadow-lg">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-semibold text-base text-amber-300">
                {entitlement.status === 'expired'
                  ? 'Candidate Search Entitlement Expired'
                  : 'Candidate Search Entitlement Required'}
              </h3>
              <p className="text-sm text-amber-300/80 leading-relaxed">
                Your recruiter organization requires an active Talent Entitlement grant to search verified candidates. Contact your platform administrator to grant or renew your entitlement.
              </p>
            </div>
          </div>
        )}

        {/* Search & Filter Section */}
        <form onSubmit={handleFilterSubmit} className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search candidates by headline or bio..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                aria-label="Search candidates by headline or bio"
              />
            </div>

            {/* Availability Filter */}
            <select
              value={selectedAvailability}
              onChange={e => setSelectedAvailability(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by availability status"
            >
              <option value="">All Availability</option>
              <option value="available">Available Now</option>
              <option value="open_to_offers">Open to Offers</option>
              <option value="not_available">Not Available</option>
            </select>

            {/* Institution Filter */}
            <select
              value={selectedInstitution}
              onChange={e => setSelectedInstitution(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by campus institution"
            >
              <option value="">All Institutions</option>
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </select>
          </div>

          {/* Skill Pills Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Skill Filters</label>
            <div className="flex flex-wrap items-center gap-2">
              {selectedSkills.map(skill => (
                <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-blue-950 text-blue-300 border border-blue-800">
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="hover:text-blue-100 transition-colors"
                    aria-label={`Remove skill ${skill}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill(skillInput);
                    }
                  }}
                  placeholder="Add skill (press Enter)..."
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {skillInput && (
                  <button
                    type="button"
                    onClick={() => addSkill(skillInput)}
                    className="text-xs px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Reset Filters
            </button>
            <button
              type="submit"
              disabled={isPending || !entitlement.has_entitlement}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Filter className="w-4 h-4" /> Apply Filters
            </button>
          </div>
        </form>

        {/* Candidate Results Region */}
        <div
          role="region"
          aria-busy={isPending}
          aria-live="polite"
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Verified Candidates ({candidates.total})
            </h2>
            <span role="status" className="text-xs text-slate-500">
              Page {candidates.current_page} of {candidates.last_page}
            </span>
          </div>

          {/* Skeleton Loading State */}
          {isPending && (
            <div className="space-y-4">
              {[1, 2, 3].map(n => (
                <div key={n} className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-6 animate-pulse space-y-3">
                  <div className="h-5 bg-slate-700/60 rounded w-1/3"></div>
                  <div className="h-4 bg-slate-700/40 rounded w-2/3"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-slate-700/50 rounded-full w-16"></div>
                    <div className="h-6 bg-slate-700/50 rounded-full w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty Results State */}
          {!isPending && candidates.data.length === 0 && (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-12 text-center space-y-4">
              <Briefcase className="w-12 h-12 text-slate-600 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-slate-300">No Candidates Found</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  No verified candidate projections match your selected filters. Try broadening your search or resetting filters.
                </p>
              </div>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Results Table / List View */}
          {!isPending && candidates.data.length > 0 && (
            <div className="space-y-4">
              {candidates.data.map(candidate => (
                <div
                  key={candidate.id}
                  className="bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/60 hover:border-blue-500/50 rounded-2xl p-6 transition-all duration-200 shadow-md group"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-bold text-slate-100 group-hover:text-blue-300 transition-colors">
                          {candidate.headline || 'Verified Student Candidate'}
                        </h3>
                        {candidate.institution_name && (
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-700">
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            {candidate.institution_name}
                          </span>
                        )}
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${
                          candidate.availability_status === 'available'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-slate-900 text-slate-400 border border-slate-700'
                        }`}>
                          {candidate.availability_status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {candidate.bio && (
                        <p className="text-sm text-slate-300/80 line-clamp-2">
                          {candidate.bio}
                        </p>
                      )}

                      {/* Skills & Badges */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {candidate.skills.map(skill => (
                          <span key={skill} className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-950/80 text-blue-300 border border-blue-900">
                            {skill}
                          </span>
                        ))}
                        {candidate.badges.map(badge => (
                          <span key={badge} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-950/80 text-amber-300 border border-amber-900">
                            <Award className="w-3 h-3 text-amber-400" />
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center">
                      <button
                        onClick={() => router.get(`/recruiter/talent/candidates/${candidate.id}`)}
                        className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700/80 hover:bg-blue-600 text-slate-100 hover:text-white text-xs font-semibold transition-all group-hover:shadow-lg group-hover:shadow-blue-500/20"
                      >
                        View Profile <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {candidates.last_page > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-slate-800">
              <button
                disabled={candidates.current_page <= 1}
                onClick={() => router.get('/recruiter/talent/search', { ...filters, page: candidates.current_page - 1 })}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors"
                aria-label="Go to previous page"
              >
                Previous
              </button>
              <span className="text-xs text-slate-400">
                Page {candidates.current_page} of {candidates.last_page}
              </span>
              <button
                disabled={candidates.current_page >= candidates.last_page}
                onClick={() => router.get('/recruiter/talent/search', { ...filters, page: candidates.current_page + 1 })}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors"
                aria-label="Go to next page"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
