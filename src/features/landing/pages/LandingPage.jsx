import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Sparkles,
  Target,
  Users,
  Video,
} from 'lucide-react';
import {
  Avatar,
  Box,
  Container,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  useTheme
} from '@mui/material';

import Navbar from '../../../common/components/Navbar/Navbar';
import Footer from '../../../common/components/Footer/Footer';
import { PrimaryButton, SecondaryButton, TextButton } from '../../../common/components/buttons';
import FormTextField from '../../../common/components/form/FormTextField';
import { Tag } from '../../../common/components';
import '../styles/LandingPage.css';

const MotionBox = motion.create(Box);
const MotionPaper = motion.create(Paper);

const FEATURES = [
  {
    icon: BrainCircuit,
    title: 'AI-Powered Gap Analysis',
    description:
      'Our AI agents analyze your current skills and identify the exact technical gaps between you and your dream role.'
  },
  {
    icon: Users,
    title: 'Expert Human Coaching',
    description:
      'Connect with world-class engineers from top companies for 1-on-1 mock interviews and guidance.'
  },
  {
    icon: Video,
    title: 'Realistic Mock Battles',
    description:
      'Experience high-pressure coding challenges in a live collaborative environment that mirrors real interview loops.'
  },
  {
    icon: Target,
    title: 'Custom Skill Roadmaps',
    description:
      'Get a structured, day-by-day learning plan tailored to your specific goals and timeline.'
  }
];

function LandingPage() {
  const navigate = useNavigate();
  const theme = useTheme();

  const [formStatus, setFormStatus] = useState('idle');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    experienceInput: '',
    linkedin: ''
  });
  const [coachProgress, setCoachProgress] = useState(0);

  const perks = [
    'Flexible hours that fit your schedule',
    'Global networking with high-caliber talent',
    'Competitive compensation & platform perks',
    'Personal brand growth as a thought leader'
  ];

  const sectionReveal = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 }
  };

  const contentReveal = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0 }
  };

  useEffect(() => {
    const filledBase = [formData.name, formData.email, formData.phone, formData.linkedin].filter(
      v => String(v || '').trim() !== ''
    ).length;
    const hasExp = Boolean(formData.experienceInput.trim());
    setCoachProgress(Math.round(((filledBase + (hasExp ? 1 : 0)) / 5) * 100));
  }, [formData]);

  const set = field => e => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const handleFormSubmit = async e => {
    e.preventDefault();
    if (formStatus === 'submitting') return;
    if (!formData.name.trim() || !formData.email.trim() || !formData.experienceInput.trim()) return;

    setFormStatus('submitting');
    await new Promise(res => setTimeout(res, 900));
    setFormStatus('success');
  };

  const handleResetForm = () => {
    setFormStatus('idle');
    setFormData({ name: '', email: '', phone: '', experienceInput: '', linkedin: '' });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary', overflowX: 'hidden' }}>
      <Navbar />

      {/* Background blobs */}
      <Box sx={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <MotionBox
          animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          sx={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 600,
            height: 600,
            borderRadius: '50%',
            bgcolor: 'info.light',
            filter: 'blur(120px)',
            opacity: 0.35
          }}
        />
        <MotionBox
          animate={{ x: [0, -40, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          sx={{
            position: 'absolute',
            top: '25%',
            left: -80,
            width: 500,
            height: 500,
            borderRadius: '50%',
            bgcolor: 'secondary.light',
            filter: 'blur(110px)',
            opacity: 0.4
          }}
        />
      </Box>

      <Box
        component="main"
        sx={{
          position: 'relative',
          zIndex: 1,
          // FIX: reduced from +52px to +24px so hero isn't pushed too far down
          pt: 'calc(var(--nav-height, 80px) + 24px)'
        }}
      >
        {/* ─── Hero ─── */}
        <Container maxWidth="xl" sx={{ pb: 8 }}>
          <Grid container spacing={6} alignItems="center" justifyContent="center" className="landing-hero-grid">
            {/* Left: copy */}
            <Grid item xs={12} md={6} className="landing-hero-copy">
              <MotionBox
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
              >
                <Tag
                  icon={<Sparkles size={14} />}
                  label="The New Standard for Interview Excellence"
                  color="secondary"
                  size="sm"
                  variant="soft"
                  sx={{ mb: 3, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}
                />
                <Typography
                  variant="h1"
                  sx={{
                    lineHeight: 0.95,
                    mb: 3,
                    fontSize: { xs: '2.9rem', md: '4rem', lg: '4.5rem' }
                  }}
                >
                  Master The Art Of The Interview.
                </Typography>
                <Typography color="text.secondary" sx={{ maxWidth: 600, mb: 4 }}>
                  Combining world-class engineering coaching with advanced AI agents to identify gaps
                  and build your personalized path to success.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                  <PrimaryButton onClick={() => navigate('/signup')} endIcon={<ArrowRight size={16} />}>
                    Boost Your Career
                  </PrimaryButton>
                  <SecondaryButton onClick={() => navigate('/questions')}>Learn More</SecondaryButton>
                </Stack>
              </MotionBox>
            </Grid>

            {/* Right: animated card */}
            <Grid
              item
              xs={12}
              md={6}
              className="landing-hero-visual"
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <MotionPaper
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.7 }}
                className="orbit-card-shell"
                sx={{
                  p: 2,
                  borderRadius: 5,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  width: '100%',
                  maxWidth: 600,
                  display: 'block',
                  mx: 'auto'
                }}
              >
                <Box
                  className="orbit-card-stage"
                  sx={{
                    width: '100%',
                    borderRadius: 5,
                    height: 350,
                    minHeight: 350,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: '#f1f2f4',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 0 0 12px rgba(255,255,255,0.18)'
                  }}
                >
                  <Box
                    className="orbit-ring"
                    sx={{
                      width: 300,
                      height: 300,
                      borderRadius: '50%',
                      border: '1px solid',
                      borderColor: 'rgba(80, 210, 242, 0.35)',
                      position: 'absolute',
                      inset: 0,
                      m: 'auto'
                    }}
                  />

                  <MotionBox
                    className="orbit-rotator"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                    sx={{
                      width: 300,
                      height: 300,
                      borderRadius: '50%',
                      position: 'absolute',
                      inset: 0,
                      m: 'auto'
                    }}
                  >
                    <Box
                      className="orbit-dot orbit-dot-purple"
                      sx={{
                        position: 'absolute',
                        top: 18,
                        right: 70,
                        width: 15,
                        height: 15,
                        borderRadius: '50%',
                        bgcolor: '#a855f7'
                      }}
                    />
                    <Box
                      className="orbit-dot orbit-dot-cyan"
                      sx={{
                        position: 'absolute',
                        bottom: 42,
                        left: 54,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        bgcolor: '#06b6d4'
                      }}
                    />
                  </MotionBox>

                  {/* Center icon */}
                  <MotionBox
                    animate={{ scale: [1, 1.1, 1], y: [0, -6, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'grid',
                      placeItems: 'center',
                      color: 'primary.main'
                    }}
                  >
                    <BrainCircuit size={64} />
                  </MotionBox>

                  {/* Decorative mini window */}
                  <Paper
                    sx={{
                      position: 'absolute',
                      top: 34,
                      left: 28,
                      p: 2.1,
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'rgba(255,255,255,0.75)',
                      bgcolor: 'rgba(255,255,255,0.74)',
                      boxShadow: '0 16px 30px rgba(17, 24, 39, 0.12)',
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    <Stack direction="row" gap={0.75} mb={1}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                    </Stack>
                    <Box sx={{ height: 8, width: 120, bgcolor: 'grey.200', borderRadius: 99, mb: 1 }} />
                    <Box sx={{ height: 8, width: 88, bgcolor: '#7dd3fc', borderRadius: 99, opacity: 0.55 }} />
                  </Paper>

                  <Paper
                    sx={{
                      position: 'absolute',
                      right: 34,
                      bottom: 30,
                      px: 2.3,
                      py: 2,
                      borderRadius: 4,
                      border: '1px solid',
                      borderColor: 'rgba(255,255,255,0.75)',
                      bgcolor: 'rgba(255,255,255,0.74)',
                      boxShadow: '0 16px 30px rgba(17, 24, 39, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      minWidth: 220
                    }}
                  >
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: '50%',
                        bgcolor: '#efe2ff',
                        color: '#9333ea',
                        display: 'grid',
                        placeItems: 'center'
                      }}
                    >
                      <Users size={20} />
                    </Box>
                    <Box>
                      <Box sx={{ height: 8, width: 88, bgcolor: 'grey.200', borderRadius: 99, mb: 1 }} />
                      <Box sx={{ height: 8, width: 72, bgcolor: 'grey.100', borderRadius: 99 }} />
                    </Box>
                  </Paper>
                </Box>
              </MotionPaper>
            </Grid>
          </Grid>
        </Container>

        {/* ─── Features ─── */}
        <Box
          id="features"
          sx={{
            py: 7,
            borderTop: '1px solid',
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'rgba(255,255,255,0.55)'
          }}
        >
          <Container maxWidth="xl">
            <Typography
              sx={{
                textAlign: 'center',
                color: 'secondary.dark',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                mb: 1
              }}
            >
              Innovative Ecosystem
            </Typography>
            <Typography
              variant="h2"
              sx={{ textAlign: 'center', mb: 6, fontSize: { xs: '2.2rem', md: '3rem' } }}
            >
              Engineered For Results
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                gap: 3,
                maxWidth: 1120,
                mx: 'auto'
              }}
            >
              {FEATURES.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <Box key={feature.title} sx={{ display: 'flex' }}>
                    <MotionPaper
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.08 }}
                      whileHover={{ y: -8 }}
                      sx={{
                        p: 3.5,
                        borderRadius: 4,
                        minHeight: 200,
                        width: '100%',
                        border: '1px solid',
                        borderColor: 'divider',
                        display: 'block',
                        mx: 'auto'
                      }}
                    >
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2.5,
                          display: 'grid',
                          placeItems: 'center',
                          mb: 2,
                          bgcolor: 'secondary.light',
                          color: 'primary.main'
                        }}
                      >
                        <Icon size={24} />
                      </Box>
                      <Typography variant="h5" sx={{ mb: 1.25 }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </MotionPaper>
                  </Box>
                );
              })}
            </Box>
          </Container>
        </Box>

        {/* ─── Coaches / Apply ─── */}
        <Box id="coaches" sx={{ py: 7 }}>
          <Container maxWidth="lg">
            <Grid container spacing={6} alignItems="stretch">
              {/* Left: perks */}
              <Grid item xs={12} md={6}>
                <MotionBox
                  variants={sectionReveal}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.6 }}
                >
                  <Stack gap={2.5} sx={{ height: '100%', justifyContent: 'center' }}>
                    <Tag
                      label="Join our network"
                      color="secondary"
                      size="sm"
                      variant="soft"
                      sx={{ width: 'fit-content', fontWeight: 800, letterSpacing: '0.08em' }}
                    />
                    <Typography variant="h2" sx={{ maxWidth: 520, fontSize: { xs: '2.1rem', md: '2.9rem' } }}>
                      Share your expertise. Mentor the next generation.
                    </Typography>
                    <Typography color="text.secondary" sx={{ maxWidth: 520 }}>
                      We are looking for Senior Engineers, Architects, and Tech Leads from global tech companies.
                    </Typography>
                    <Stack gap={1.25}>
                      {perks.map((item, idx) => (
                        <MotionBox
                          key={item}
                          variants={contentReveal}
                          initial="hidden"
                          whileInView="visible"
                          viewport={{ once: true, amount: 0.55 }}
                          transition={{ duration: 0.45, delay: idx * 0.08 }}
                        >
                          <Stack direction="row" gap={1.25} alignItems="center">
                            <Box
                              sx={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                bgcolor: 'secondary.main',
                                color: 'secondary.contrastText',
                                display: 'grid',
                                placeItems: 'center'
                              }}
                            >
                              <CheckCircle2 size={13} />
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {item}
                            </Typography>
                          </Stack>
                        </MotionBox>
                      ))}
                    </Stack>
                    <Stack direction="row" gap={1.5} pt={1}>
                      <PrimaryButton onClick={() => navigate('/home')}>Start now</PrimaryButton>
                      <SecondaryButton onClick={() => navigate('/questions')}>Explore bank</SecondaryButton>
                    </Stack>
                  </Stack>
                </MotionBox>
              </Grid>

              {/* Right: form */}
              <Grid item xs={12} md={6}>
                <MotionPaper
                  variants={sectionReveal}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.65, delay: 0.1 }}
                  sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Box
                    sx={{
                      height: 4,
                      background: `linear-gradient(90deg, ${theme.palette.secondary.dark}, ${theme.palette.secondary.main})`
                    }}
                  />
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h4" sx={{ mb: 0.5, fontWeight: 800 }}>
                      Apply now
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Takes 2 minutes · We&apos;ll review within 48h
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={formStatus === 'submitting' ? 100 : coachProgress}
                      sx={{ mb: 3, height: 6, borderRadius: 99 }}
                    />
                    <AnimatePresence mode="wait">
                      {formStatus === 'success' ? (
                        <MotionBox
                          key="success"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.03 }}
                        >
                          <Stack alignItems="center" textAlign="center" gap={1.5} py={2}>
                            <Avatar
                              sx={{
                                width: 60,
                                height: 60,
                                bgcolor: 'secondary.main',
                                color: 'secondary.contrastText'
                              }}
                            >
                              <CheckCircle2 size={28} />
                            </Avatar>
                            <Typography variant="h4" sx={{ fontWeight: 800 }}>
                              Application Received
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ maxWidth: 320 }}
                            >
                              Thank you for applying. Our team will review your profile and reach out
                              within 48 hours.
                            </Typography>
                            <TextButton onClick={handleResetForm}>Submit another →</TextButton>
                          </Stack>
                        </MotionBox>
                      ) : (
                        <MotionBox
                          key="form"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <Stack component="form" onSubmit={handleFormSubmit} gap={2}>
                            <FormTextField
                              id="f-name"
                              label="Full Name"
                              value={formData.name}
                              onChange={set('name')}
                              required
                              fullWidth
                            />
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <FormTextField
                                  id="f-email"
                                  label="Work Email"
                                  type="email"
                                  value={formData.email}
                                  onChange={set('email')}
                                  required
                                  fullWidth
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <FormTextField
                                  id="f-phone"
                                  label="Phone Number"
                                  type="tel"
                                  value={formData.phone}
                                  onChange={set('phone')}
                                  fullWidth
                                />
                              </Grid>
                            </Grid>
                            <FormTextField
                              id="f-exp"
                              label="Years of Experience"
                              value={formData.experienceInput}
                              onChange={set('experienceInput')}
                              required
                              fullWidth
                            />
                            <FormTextField
                              id="f-linkedin"
                              label="LinkedIn Profile URL"
                              type="url"
                              value={formData.linkedin}
                              onChange={set('linkedin')}
                              fullWidth
                            />
                            <PrimaryButton
                              type="submit"
                              fullWidth
                              loading={formStatus === 'submitting'}
                            >
                              Submit application
                            </PrimaryButton>
                          </Stack>
                        </MotionBox>
                      )}
                    </AnimatePresence>
                  </Box>
                </MotionPaper>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* ─── Stats ─── */}
        {/* <Box
          id="stats"
          sx={{
            py: 8,
            borderTop: '1px solid',
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'rgba(255,255,255,0.55)'
          }}
        >
          <Container maxWidth="xl">
            <Stack
              direction="row"
              flexWrap="wrap"
              justifyContent="center"
              gap={{ xs: 5, md: 10 }}
            >
              {[
                { label: 'Successful Placements', value: '12,400+' },
                { label: 'Active FAANG Coaches', value: '850+' },
                { label: 'Global Study Rooms', value: '500+' },
                { label: 'Avg Rating', value: '4.95/5' }
              ].map((stat, i) => (
                <MotionBox
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  sx={{ textAlign: 'center' }}
                >
                  <Typography variant="h3" sx={{ fontWeight: 800 }}>
                    {stat.value}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: 'text.secondary',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em'
                    }}
                  >
                    {stat.label}
                  </Typography>
                </MotionBox>
              ))}
            </Stack>
          </Container>
        </Box> */}

        {/* ─── Footer ─── */}
        <Footer />
      </Box>
    </Box>
  );
}

export default LandingPage;
