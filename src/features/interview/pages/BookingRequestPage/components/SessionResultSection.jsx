import React, { useState } from 'react';
import {
    Box,
    Typography,
    Stack,
    Grid,
    Rating,
    CircularProgress,
    Tabs,
    Tab
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { callApi } from '../../../../../common/utils/apiConnector';
import { METHOD } from '../../../../../common/constants/api';
import { SecondaryButton } from '../../../../../common/components/buttons';

// Thin dark progress bar matching design
const SlimProgress = styled(LinearProgress)(({ theme }) => ({
    height: 4,
    borderRadius: 2,
    [`&.${linearProgressClasses.colorPrimary}`]: {
        backgroundColor: '#eef2ff',
    },
    [`& .${linearProgressClasses.bar}`]: {
        borderRadius: 2,
        backgroundColor: '#0f172a',
    },
}));

// Circular gauge — matches design exactly
const CircularGauge = ({ value }) => {
    const pct = Math.max(0, Math.min(100, value * 10));
    return (
        <Box sx={{ position: 'relative', display: 'inline-flex', width: 160, height: 160 }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle
                    cx="18" cy="18" r="15.9"
                    fill="none"
                    stroke="#eef2ff"
                    strokeWidth="2.8"
                />
                <circle
                    cx="18" cy="18" r="15.9"
                    fill="none"
                    stroke="#bef264"
                    strokeWidth="2.8"
                    strokeDasharray={`${pct} ${100 - pct}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                />
            </svg>
            <Box sx={{
                top: 0, left: 0, bottom: 0, right: 0,
                position: 'absolute',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column'
            }}>
                <Typography fontWeight={900} color="#0f172a" sx={{ fontSize: '2.2rem', lineHeight: 1, letterSpacing: '-0.02em' }}>
                    {value.toFixed(1)}
                </Typography>
                <Typography color="#94a3b8" fontWeight={600} sx={{ fontSize: '0.8rem', mt: 0.2 }}>
                    / 10
                </Typography>
            </Box>
        </Box>
    );
};

const RoundResultItem = ({ round }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [evaluation, setEvaluation] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [hasLoaded, setHasLoaded] = useState(false);

    const interviewRoomId = round?.interviewRoomId;

    React.useEffect(() => {
        const fetchData = async () => {
            if (!interviewRoomId || hasLoaded) return;
            setLoading(true);
            try {
                const evalRes = await callApi({
                    method: METHOD.GET,
                    endpoint: `/interviewroom/${interviewRoomId}/coach-evaluation`
                });
                if (evalRes.success) setEvaluation(evalRes.data);

                const feedbackRes = await callApi({
                    method: METHOD.GET,
                    endpoint: `/Feedbacks/interview-room/${interviewRoomId}`
                });
                if (feedbackRes.success) {
                    const data = Array.isArray(feedbackRes.data) ? feedbackRes.data[0] : feedbackRes.data;
                    setFeedback(data);
                }
                setHasLoaded(true);
            } catch (err) {
                console.error('Error fetching session results:', err);
                setHasLoaded(true);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [interviewRoomId, hasLoaded, round]);

    const rawResults = evaluation?.evaluationResults || [];
    const skills = rawResults.map((result, i) => ({
        name: result?.question || result?.criterion || result?.name || `Criteria ${i + 1}`,
        score: typeof result?.score === 'number' ? result.score : null,
        comment: result?.answer || result?.comment || result?.notes || '',
    }));

    const overallScore = skills.length > 0
        ? skills.reduce((acc, s) => acc + (s.score || 0), 0) / skills.length
        : 0;

    const isCompleted = round.interviewRoomStatus === 'COMPLETED';
    const hasData = skills.length > 0;

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={36} sx={{ color: '#bef264' }} />
            </Box>
        );
    }

    if (!isCompleted && !hasData) {
        return (
            <Box sx={{
                bgcolor: 'white', p: 5, borderRadius: '24px',
                border: '1px solid #f1f5f9', textAlign: 'center', mb: 3
            }}>
                <Typography fontWeight={800} sx={{ mb: 1, color: '#0f172a', fontSize: '1.1rem' }}>
                    Session in Progress
                </Typography>
                <Typography variant="body2" color="#64748b">
                    Results will appear here once <strong>{round.interviewTypeName}</strong> is completed.
                </Typography>
            </Box>
        );
    }

    if (!hasData) {
        return (
            <Box sx={{
                bgcolor: 'white', p: 5, borderRadius: '24px',
                border: '1px solid #f1f5f9', textAlign: 'center', mb: 3
            }}>
                <Typography fontWeight={800} sx={{ mb: 1, color: '#0f172a', fontSize: '1.1rem' }}>
                    Evaluation Pending
                </Typography>
                <Typography variant="body2" color="#64748b">
                    Waiting for the coach to submit evaluation for <strong>{round.interviewTypeName}</strong>.
                </Typography>
            </Box>
        );
    }

    return (
        <Stack spacing={3}>
            {/* ──── UNIFIED PERFORMANCE + EVALUATION CARD ──── */}
            <Box sx={{
                bgcolor: 'white',
                borderRadius: '24px',
                border: '1px solid #f1f5f9',
                overflow: 'hidden',
                display: 'flex',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}>
                {/* Left: Overall Performance */}
                <Box sx={{
                    width: { xs: '100%', md: '30%' },
                    minWidth: { md: 220 },
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRight: { md: '1px solid #f1f5f9' },
                    gap: 2,
                }}>
                    <Typography
                        variant="caption"
                        color="#94a3b8"
                        fontWeight={700}
                        sx={{ letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '0.7rem' }}
                    >
                        Overall Performance
                    </Typography>

                    <CircularGauge value={overallScore} />

                    <Box sx={{
                        px: 1.5, py: 0.5, borderRadius: '20px',
                        bgcolor: '#f0fdf4',
                        display: 'flex', alignItems: 'center', gap: 0.75
                    }}>
                        <FiberManualRecordIcon sx={{ fontSize: 8, color: '#22c55e' }} />
                        <Typography variant="caption" fontWeight={900} color="#166534" sx={{ fontSize: '0.7rem' }}>
                            TOP 5% IN BATCH
                        </Typography>
                    </Box>
                </Box>

                {/* Right: Coach Evaluation */}
                <Box sx={{ flex: 1, p: 4 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                        <Typography fontWeight={800} color="#0f172a" sx={{ fontSize: '1.25rem', letterSpacing: '-0.01em' }}>
                            Coach Evaluation
                        </Typography>
                        <Typography variant="caption" color="#94a3b8" fontWeight={500} sx={{ fontStyle: 'italic' }}>
                            Evaluated by {evaluation?.coachName || 'Coach'}
                        </Typography>
                    </Stack>

                    <Grid container spacing={3} alignItems="stretch">
                        {skills.map((skill, idx) => (
                            <Grid item xs={12} sm={6} key={idx} sx={{ display: 'flex' }}>
                                <Box sx={{ flex: 1 }}>
                                    {/* Skill name + score on same row */}
                                    <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 0.75 }}>
                                        <Typography variant="body2" fontWeight={700} color="#0f172a" sx={{ flex: 1, pr: 1, lineHeight: 1.4 }}>
                                            {skill.name}
                                        </Typography>
                                        <Typography fontWeight={900} sx={{
                                            fontSize: '1rem',
                                            color: '#6abf40',
                                            whiteSpace: 'nowrap',
                                            letterSpacing: '-0.01em'
                                        }}>
                                            {typeof skill.score === 'number' ? skill.score.toFixed(1) : '—'}
                                        </Typography>
                                    </Stack>

                                    {/* Thin progress bar */}
                                    <SlimProgress
                                        variant="determinate"
                                        value={typeof skill.score === 'number' ? skill.score * 10 : 0}
                                        sx={{ mb: 1 }}
                                    />

                                    {/* Comment */}
                                    {skill.comment && (
                                        <Typography variant="caption" color="#64748b" sx={{ lineHeight: 1.5, display: 'block' }}>
                                            {skill.comment}
                                        </Typography>
                                    )}
                                </Box>
                            </Grid>
                        ))}
                    </Grid>

                    {/* ACTION: View Room (View Only) */}
                    {(() => {
                        const targetRoomId = round.interviewRoomId || round.roomId || round.roomID;
                        if (!targetRoomId) return null;

                        return (
                            <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #f1f5f9' }}>
                                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography variant="body2" fontWeight={800} color="#0f172a" sx={{ mb: 0.5 }}>Coding Workspace Saved</Typography>
                                        <Typography variant="caption" color="#64748b">Review the problem statement, your code, and test results in read-only mode.</Typography>
                                    </Box>
                                    <SecondaryButton
                                        onClick={() => navigate(`/interview/room/${targetRoomId}?viewOnly=true`)}
                                        sx={{
                                            borderRadius: '12px',
                                            px: 3,
                                            bgcolor: '#0f172a',
                                            color: 'white',
                                            '&:hover': { bgcolor: '#1e293b' },
                                            fontSize: '0.8rem',
                                            fontWeight: 800,
                                            gap: 1
                                        }}
                                    >
                                        Review Workspace ↗
                                    </SecondaryButton>
                                </Stack>
                            </Box>
                        );
                    })()}
                </Box>
            </Box>

            {/* ──── MY FEEDBACK CARD ──── */}
            <Box sx={{ bgcolor: 'white', borderRadius: '24px', border: '1px solid #f1f5f9', p: 4 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: '#bef264', borderRadius: '8px', p: 0.6, width: 28, height: 28
                        }}>
                            <FormatAlignLeftIcon sx={{ fontSize: 16, color: '#0f172a' }} />
                        </Box>
                        <Typography fontWeight={800} color="#0f172a" sx={{ fontSize: '1rem' }}>
                            My Feedback
                        </Typography>
                    </Stack>
                    
                    <Box sx={{ textAlign: 'right' }}>
                         <Typography variant="caption" color="#94a3b8" fontWeight={700} sx={{ letterSpacing: '0.08em', display: 'block', mb: 0.5, fontSize: '0.62rem', textTransform: 'uppercase' }}>
                            Coach Rating
                        </Typography>
                        <Rating
                            value={feedback?.rating || 0}
                            readOnly
                            precision={0.5}
                            sx={{ color: '#eab308', fontSize: '1.8rem' }}
                            emptyIcon={<StarIcon style={{ opacity: 0.15, color: '#eab308' }} fontSize="inherit" />}
                        />
                    </Box>
                </Stack>

                {/* Quote block */}
                <Box sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: '12px', mb: 3 }}>
                    <Typography
                        variant="body2"
                        color="#495057"
                        sx={{ fontStyle: 'italic', lineHeight: 1.7 }}
                    >
                        {feedback?.comments
                            ? feedback.comments
                            : 'Recording your thoughts helps in identifying areas for improvement.'}
                    </Typography>
                </Box>

                {/* Feedback content rendered above */}
            </Box>
        </Stack>
    );
};

export default function SessionResultSection({ bookingRequest }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);

    if (!bookingRequest) return null;

    let rounds = bookingRequest.rounds || [];
    
    if (rounds.length === 0) {
        rounds = [{
            id: bookingRequest.id,
            roundNumber: 1,
            interviewTypeName: bookingRequest.interviewTypeName || 'General Interview',
            startTime: bookingRequest.requestedStartTime || bookingRequest.createdAt,
            interviewRoomId: bookingRequest.interviewRoomId || null,
            interviewRoomStatus: bookingRequest.interviewRoomStatus || null,
            isCoding: false
        }];
    }

    const isMultiRound = rounds.length > 1;

    return (
        <Box sx={{ mt: 2 }}>
            {/* Tab switcher — and Round Title */}
            {isMultiRound ? (
                <Box sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    mb: 4, pb: 0, px: 1
                }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="h6" fontWeight={900} color="#0f172a" sx={{ letterSpacing: '-0.02em', fontSize: '1.25rem' }}>
                            Performance Insights
                        </Typography>
                        <Tabs
                            value={activeTab}
                            onChange={(_, v) => setActiveTab(v)}
                            sx={{
                                minHeight: 0,
                                '& .MuiTabs-indicator': { backgroundColor: '#0f172a', height: 2.5, borderRadius: 1 },
                                '& .MuiTabs-flexContainer': { gap: 1 },
                            }}
                        >
                            {rounds.map((r, i) => (
                                <Tab
                                    key={r.id || i}
                                    label={`ROUND ${r.roundNumber}`}
                                    sx={{
                                        minHeight: 36, py: 0.5, px: 2,
                                        fontSize: '0.75rem', fontWeight: 800,
                                        color: '#94a3b8', textTransform: 'uppercase',
                                        letterSpacing: '0.08em',
                                        borderRadius: '10px', minWidth: 0,
                                        '&.Mui-selected': { color: '#0f172a' },
                                        '&:hover': { color: '#64748b' }
                                    }}
                                />
                            ))}
                        </Tabs>
                    </Stack>
                    <Typography variant="caption" color="#94a3b8" fontWeight={600} sx={{ fontStyle: 'italic' }}>
                        Switch tabs to view results per round
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ mb: 4, px: 1 }}>
                    <Typography variant="h6" fontWeight={900} color="#0f172a" sx={{ letterSpacing: '-0.02em', fontSize: '1.25rem' }}>
                        Session Insights
                    </Typography>
                </Box>
            )}

            {/* Always render the single active round */}
            <RoundResultItem
                key={rounds[activeTab]?.id || activeTab}
                round={rounds[activeTab] || rounds[0]}
            />
        </Box>
    );
}
