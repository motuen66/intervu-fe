export const getChildSkillNames = (childSkills = []) =>
    childSkills
        .map((childSkill) => {
            if (typeof childSkill === "string") {
                return childSkill;
            }

            if (childSkill && typeof childSkill === "object") {
                return childSkill.name ?? childSkill.Name ?? "";
            }

            return "";
        })
        .filter(Boolean);

export const normalizeRoadmapPayload = (rawRoadmap) => {
    if (!rawRoadmap) {
        return null;
    }

    const metadataSource =
        rawRoadmap.roadmap_metadata ?? rawRoadmap.roadmapMetadata ?? rawRoadmap.RoadmapMetadata ?? {};
    const phasesSource = rawRoadmap.phases ?? rawRoadmap.Phases ?? [];

    if (!Array.isArray(phasesSource) || phasesSource.length === 0) {
        return null;
    }

    const normalizedPhases = phasesSource.map((phase, phaseIndex) => {
        const nodesSource = phase.nodes ?? phase.Nodes ?? [];
        const coachesSource = phase.recommended_coaches ?? phase.recommendedCoaches ?? phase.RecommendedCoaches ?? [];
        const mockHistorySource = phase.mock_history ?? phase.mockHistory ?? phase.MockHistory ?? [];

        return {
            phase_id: phase.phase_id ?? phase.phaseId ?? phase.PhaseId ?? `phase_${phaseIndex + 1}`,
            phase_name: phase.phase_name ?? phase.phaseName ?? phase.PhaseName ?? `Phase ${phaseIndex + 1}`,
            phase_description: phase.phase_description ?? phase.phaseDescription ?? phase.PhaseDescription ?? "",
            status: phase.status ?? phase.Status ?? "Unlocked",
            is_unlocked: phase.is_unlocked ?? phase.isUnlocked ?? phase.IsUnlocked ?? true,
            unlocked_at: phase.unlocked_at ?? phase.unlockedAt ?? phase.UnlockedAt ?? null,
            passed_at: phase.passed_at ?? phase.passedAt ?? phase.PassedAt ?? null,
            checkpoint_evaluation:
                phase.checkpoint_evaluation ?? phase.checkpointEvaluation ?? phase.CheckpointEvaluation ?? null,
            recommended_coaches: coachesSource.map((coach, coachIndex) => ({
                id: coach.id ?? coach.Id ?? `coach_${phaseIndex}_${coachIndex}`,
                name: coach.name ?? coach.Name ?? "Unknown Coach",
                role: coach.role ?? coach.Role ?? "",
                rating: coach.rating ?? coach.Rating ?? 0,
                avatar: coach.avatar ?? coach.Avatar ?? "",
                slug_profile_url:
                    coach.slug_profile_url ?? coach.slugProfileUrl ?? coach.SlugProfileUrl ?? coach.profileUrl ?? coach.ProfileUrl ?? null,
                avatar_url: coach.avatar_url ?? coach.avatarUrl ?? coach.AvatarUrl ?? coach.avatar ?? coach.Avatar ?? "",
            })),
            recommended_coach: (() => {
                const src = phase.recommended_coach ?? phase.recommendedCoach ?? phase.RecommendedCoach ?? null;
                if (!src) return null;
                return {
                    id: src.id ?? src.Id ?? "",
                    name: src.name ?? src.Name ?? "",
                    slug_profile_url:
                        src.slug_profile_url ?? src.slugProfileUrl ?? src.SlugProfileUrl ?? "",
                    avatar_url: src.avatar_url ?? src.avatarUrl ?? src.AvatarUrl ?? "",
                };
            })(),
            mock_history: mockHistorySource.map((mock, mockIndex) => ({
                mock_id: mock.mock_id ?? mock.mockId ?? mock.MockId ?? `mock_${phaseIndex}_${mockIndex}`,
                mock_title: mock.mock_title ?? mock.mockTitle ?? mock.MockTitle ?? "Mock Session",
                interview_type: mock.interview_type ?? mock.interviewType ?? mock.InterviewType ?? "",
                coach_name: mock.coach_name ?? mock.coachName ?? mock.CoachName ?? "",
                interviewed_at: mock.interviewed_at ?? mock.interviewedAt ?? mock.InterviewedAt ?? "",
                evaluation: mock.evaluation ?? mock.Evaluation ?? [],
            })),
            nodes: Array.isArray(nodesSource)
                ? nodesSource.map((node, nodeIndex) => {
                      const assessment = node.assessment ?? node.Assessment ?? {};
                      const childSkills = node.child_skills ?? node.childSkills ?? node.ChildSkills ?? [];
                      const recommendedCoachSource =
                          node.recommended_coach ?? node.recommendedCoach ?? node.RecommendedCoach ?? null;
                      const interviewDrillsSource =
                          node.interview_drills ?? node.interviewDrills ?? node.InterviewDrills ?? [];
                      const skillId =
                          node.skill_id ?? node.skillId ?? node.SkillId ?? `skill_${phaseIndex}_${nodeIndex}`;

                      return {
                          node_id: node.node_id ?? node.nodeId ?? node.NodeId ?? skillId,
                          skill_id: skillId,
                          skill_name: node.skill_name ?? node.skillName ?? node.SkillName ?? "Skill",
                          pillar_type: node.pillar_type ?? node.pillarType ?? node.PillarType ?? "HARD_SKILL",
                          checkpoint: node.checkpoint ?? node.Checkpoint ?? null,
                          mentor_note: node.mentor_note ?? node.mentorNote ?? node.MentorNote ?? "",
                          interview_drills: Array.isArray(interviewDrillsSource)
                              ? interviewDrillsSource
                                    .map((drill) =>
                                        typeof drill === "string" ? drill : (drill?.text ?? drill?.label ?? ""),
                                    )
                                    .filter(Boolean)
                              : [],
                          assessment: {
                              current_level:
                                  assessment.current_level ?? assessment.currentLevel ?? assessment.CurrentLevel ?? "",
                              target_level:
                                  assessment.target_level ?? assessment.targetLevel ?? assessment.TargetLevel ?? "",
                              sfia_level: assessment.sfia_level ?? assessment.sfiaLevel ?? assessment.SfiaLevel ?? 0,
                              status: assessment.status ?? assessment.Status ?? "Missing",
                              progress: assessment.progress ?? assessment.Progress ?? 0,
                              score: assessment.score ?? assessment.Score ?? 0,
                          },
                          child_skills: Array.isArray(childSkills)
                              ? childSkills.map((childSkill) => {
                                    if (typeof childSkill === "string") {
                                        return childSkill;
                                    }

                                    const questions = childSkill.questions ?? childSkill.Questions ?? [];
                                    return {
                                        name: childSkill.name ?? childSkill.Name ?? "",
                                        questions: Array.isArray(questions)
                                            ? questions.map((question, questionIndex) => ({
                                                  id: question.id ?? question.Id ?? `${questionIndex}`,
                                                  title: question.title ?? question.Title ?? "",
                                                  difficulty: question.difficulty ?? question.Difficulty ?? "",
                                              }))
                                            : [],
                                    };
                                })
                              : [],
                          recommended_coach: recommendedCoachSource
                              ? {
                                    id: recommendedCoachSource.id ?? recommendedCoachSource.Id ?? "",
                                    name: recommendedCoachSource.name ?? recommendedCoachSource.Name ?? "",
                                    slug_profile_url:
                                        recommendedCoachSource.slug_profile_url ??
                                        recommendedCoachSource.slugProfileUrl ??
                                        recommendedCoachSource.SlugProfileUrl ??
                                        "",
                                    avatar_url:
                                        recommendedCoachSource.avatar_url ??
                                        recommendedCoachSource.avatarUrl ??
                                        recommendedCoachSource.AvatarUrl ??
                                        "",
                                }
                              : null,
                      };
                  })
                : [],
        };
    });

    const masteredSource =
        rawRoadmap.mastered_summary ?? rawRoadmap.masteredSummary ?? rawRoadmap.MasteredSummary ?? [];

    return {
        schema_version: rawRoadmap.schema_version ?? rawRoadmap.schemaVersion ?? rawRoadmap.SchemaVersion ?? 1,
        roadmap_metadata: {
            target_role: metadataSource.target_role ?? metadataSource.targetRole ?? metadataSource.TargetRole ?? "",
            target_level: metadataSource.target_level ?? metadataSource.targetLevel ?? metadataSource.TargetLevel ?? "",
            total_phases:
                metadataSource.total_phases ??
                metadataSource.totalPhases ??
                metadataSource.TotalPhases ??
                normalizedPhases.length,
        },
        phases: normalizedPhases,
        mastered_summary: Array.isArray(masteredSource)
            ? masteredSource
                  .map((item) => ({
                      skill_id: item.skill_id ?? item.skillId ?? item.SkillId ?? "",
                      skill_name: item.skill_name ?? item.skillName ?? item.SkillName ?? item.skill_id ?? "",
                      current_level: item.current_level ?? item.currentLevel ?? item.CurrentLevel ?? 0,
                      target_level: item.target_level ?? item.targetLevel ?? item.TargetLevel ?? 0,
                  }))
                  .filter((item) => item.skill_name)
            : [],
    };
};

export const extractRoadmapFromResponse = (response) => response?.data?.roadmap ?? response?.data?.Roadmap ?? null;

export const hasRoadmapContent = (value) => Boolean(normalizeRoadmapPayload(value)?.phases?.length);

export const getPhaseProgress = (phase) => {
    const nodes = phase?.nodes ?? [];
    if (!nodes.length) return 0;
    const total = nodes.reduce((sum, node) => sum + (Number(node.assessment?.progress) || 0), 0);
    return Math.round(total / nodes.length);
};

export const countNodesByPillar = (phase) =>
    (phase?.nodes ?? []).reduce(
        (acc, node) => {
            const pillar = node.pillar_type ?? "HARD_SKILL";
            acc[pillar] = (acc[pillar] ?? 0) + 1;
            return acc;
        },
        { HARD_SKILL: 0, SOFT_SKILL: 0, LIVE_CHECKPOINT: 0 },
    );
