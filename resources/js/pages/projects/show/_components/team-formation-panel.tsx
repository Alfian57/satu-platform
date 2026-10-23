import { ShieldCheck } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { TeamActiveMembers } from '@/pages/projects/show/_components/team/team-active-members';
import { TeamCapacityCard } from '@/pages/projects/show/_components/team/team-capacity-card';
import { TeamDecisionDialog } from '@/pages/projects/show/_components/team/team-decision-dialog';
import { TeamFeedbackAlert } from '@/pages/projects/show/_components/team/team-feedback-alert';
import { TeamHistoryList } from '@/pages/projects/show/_components/team/team-history-list';
import { TeamInvitationList } from '@/pages/projects/show/_components/team/team-invitation-list';
import { TeamJoinForm } from '@/pages/projects/show/_components/team/team-join-form';
import { TeamMembershipBanner } from '@/pages/projects/show/_components/team/team-membership-banner';
import { TeamPendingRequestCard } from '@/pages/projects/show/_components/team/team-pending-request-card';
import { TeamRequestQueue } from '@/pages/projects/show/_components/team/team-request-queue';
import { TeamSentInvitations } from '@/pages/projects/show/_components/team/team-sent-invitations';
import type { TeamFormationProps } from '@/pages/projects/show/_components/team/team-utils';
import { useTeamFormation } from '@/pages/projects/show/_hooks/use-team-formation';

export function TeamFormationPanel({
    projectId,
    roles,
    team,
    canWorkspace = false,
    onAccessDenied,
}: TeamFormationProps) {
    const { state, actions, feedbackRef, triggerRef } = useTeamFormation({
        projectId,
        roles,
        team,
        canWorkspace,
        onAccessDenied,
    });

    return (
        <section
            aria-labelledby="team-formation-title"
            aria-busy={state.busy}
            className="grid min-w-0 gap-6 border-t border-border px-1 pt-6"
            data-test="team-formation-panel"
        >
            <div className="grid gap-2">
                <p className="font-label text-label text-primary">Tim proyek</p>
                <h2
                    id="team-formation-title"
                    tabIndex={-1}
                    className="text-title font-semibold focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-ring"
                >
                    Temukan tempatmu dalam tim
                </h2>
                <p className="max-w-[70ch] text-sm leading-6 text-muted-foreground">
                    Pahami peran, ajukan minat, lalu baca keputusan. Pengajuan
                    bukan jaminan penerimaan dan tidak memesan tempat.
                </p>
            </div>

            {!state.decision && (
                <TeamFeedbackAlert
                    error={state.error}
                    validation={state.validation}
                    mustCheck={state.mustCheck}
                    syncing={state.syncing}
                    feedbackRef={feedbackRef}
                    onReload={() => actions.reload()}
                />
            )}

            {state.message && (
                <p
                    role="status"
                    className="rounded-xl border border-verified/40 bg-verified-subtle p-3 text-sm leading-6"
                >
                    {state.message}
                </p>
            )}

            {state.syncing && (
                <p
                    role="status"
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                    <Spinner aria-hidden="true" />
                    Memuat status tim terbaru...
                </p>
            )}

            <TeamCapacityCard capacity={team.capacity} />

            {team.current_membership && (
                <TeamMembershipBanner
                    projectId={projectId}
                    membership={team.current_membership}
                    canWorkspace={canWorkspace}
                />
            )}

            {!state.owner && (
                <div
                    className="grid min-w-0 gap-6"
                    data-test="student-team-view"
                >
                    <TeamInvitationList
                        invitations={team.pending_invitations}
                        blocked={state.blocked}
                        onOpenDecision={actions.openDecision}
                    />

                    {team.pending_join_request && (
                        <TeamPendingRequestCard
                            pendingRequest={team.pending_join_request}
                            canWithdraw={team.permissions.can_withdraw}
                            blocked={state.blocked}
                            onOpenDecision={actions.openDecision}
                        />
                    )}

                    {!team.current_membership &&
                        team.pending_invitations.length === 0 &&
                        !team.pending_join_request && (
                            <TeamJoinForm
                                roles={roles}
                                capacity={team.capacity}
                                canRequestJoin={
                                    team.permissions.can_request_join
                                }
                                data={state.joinData}
                                errors={state.joinErrors}
                                blocked={state.blocked}
                                processing={state.joinProcessing}
                                selectedRole={state.selectedRole}
                                onChangeField={actions.setJoinField}
                                onSubmit={actions.submitJoin}
                            />
                        )}
                </div>
            )}

            {state.owner && (
                <div className="grid min-w-0 gap-6" data-test="owner-team-view">
                    <TeamActiveMembers members={team.active_members} />
                    <TeamRequestQueue
                        requests={team.join_requests}
                        capacityState={team.capacity.state}
                        blocked={state.blocked}
                        onOpenDecision={actions.openDecision}
                    />
                    <TeamSentInvitations
                        invitations={team.sent_invitations}
                        blocked={state.blocked}
                        onOpenDecision={actions.openDecision}
                    />
                </div>
            )}

            <TeamHistoryList
                owner={state.owner}
                history={state.history}
                blocked={state.blocked}
                onReloadPage={(page) => actions.reload(undefined, page)}
            />

            <p className="flex gap-2 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
                <ShieldCheck
                    className="mt-0.5 size-4 shrink-0 text-verified"
                    aria-hidden="true"
                />
                <span>
                    Ringkasan pengajuan dan alasan keputusan bukan informasi
                    publik. Bukti privat profil tidak dibagikan melalui panel
                    ini.
                </span>
            </p>

            <TeamDecisionDialog
                decision={state.decision}
                busy={state.busy}
                blocked={state.blocked}
                reason={state.decisionReason}
                decisionErrors={state.decisionErrors}
                decisionProcessing={state.decisionProcessing}
                mustCheck={state.mustCheck}
                syncing={state.syncing}
                error={state.error}
                triggerRef={triggerRef}
                feedbackRef={feedbackRef}
                onClose={actions.closeDecision}
                onChangeReason={actions.setDecisionReason}
                onSubmitDecision={actions.submitDecision}
                onReload={() => actions.reload()}
            />
        </section>
    );
}
