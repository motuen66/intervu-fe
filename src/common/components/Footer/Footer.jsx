import { Github, Linkedin, Mail, MapPin, Phone, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Box, Container, Stack, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 5,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Container maxWidth="xl">
        {/* 4-column flex row */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: { xs: 4, md: 2 },
        }}>

          {/* Brand + social */}
          <Box sx={{ flex: '1 1 240px', maxWidth: 320 }}>
            <Box sx={{ mb: 1.5 }}>
              <Box sx={{
                display: 'inline-block',
                bgcolor: 'primary.dark',
                borderRadius: 2,
                px: 1.2, py: 0.6,
              }}>
                <img
                  src="/intervu-logo.png"
                  alt="INTERVU"
                  style={{ height: 28, display: 'block' }}
                />
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 2 }}>
              Redefining technical interview preparation through AI and expert human guidance.
            </Typography>
            <Stack direction="row" gap={1}>
              {[Github, Twitter, Linkedin].map((Icon, idx) => (
                <MotionBox key={idx} component="a" href="#" whileHover={{ y: -3 }} sx={{
                  width: 34, height: 34, borderRadius: 1.5,
                  border: '1px solid', borderColor: 'divider',
                  color: 'text.secondary', display: 'grid', placeItems: 'center',
                  textDecoration: 'none',
                  transition: 'color 0.2s, border-color 0.2s, background 0.2s',
                  '&:hover': { color: 'primary.main', borderColor: 'primary.light', bgcolor: 'action.hover' },
                }}>
                  <Icon size={15} />
                </MotionBox>
              ))}
            </Stack>
          </Box>

          {/* Product */}
          <Box sx={{ flex: '0 0 auto' }}>
            <Typography sx={{ mb: 1.75, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'text.disabled' }}>
              Product
            </Typography>
            <Stack gap={1.2} sx={{
              '& a': { color: 'text.secondary', textDecoration: 'none', fontWeight: 600, fontSize: 13, transition: 'color 0.2s' },
              '& a:hover': { color: 'text.primary' },
            }}>
              <Link to="/home">Find a Coach</Link>
              <Link to="/questions">Question Bank</Link>
              <Link to="/roadmap">Roadmap</Link>
            </Stack>
          </Box>

          {/* Company */}
          <Box sx={{ flex: '0 0 auto' }}>
            <Typography sx={{ mb: 1.75, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'text.disabled' }}>
              Company
            </Typography>
            <Stack gap={1.2} sx={{
              '& a': { color: 'text.secondary', textDecoration: 'none', fontWeight: 600, fontSize: 13, transition: 'color 0.2s' },
              '& a:hover': { color: 'text.primary' },
            }}>
              <Box component="a" href="#">About Us</Box>
              <Box component="a" href="#">Contact</Box>
              <Box component="a" href="#">Privacy Policy</Box>
            </Stack>
          </Box>

          {/* Contact */}
          <Box sx={{ flex: '1 1 200px', maxWidth: 300 }}>
            <Typography sx={{ mb: 1.75, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'text.disabled' }}>
              Contact
            </Typography>
            <Stack gap={1.1}>
              {[
                { Icon: MapPin, text: 'Da Nang, Vietnam' },
                { Icon: Phone, text: '+84 123 456 789' },
                { Icon: Mail, text: 'contact@intervu.vn' },
              ].map(({ Icon, text }) => (
                <Stack key={text} direction="row" alignItems="center" gap={1.25} sx={{
                  px: 1.6, py: 1,
                  border: '1px solid', borderColor: 'divider',
                  borderRadius: 2, bgcolor: 'background.default',
                }}>
                  <Icon size={15} color="var(--mui-palette-secondary-dark)" strokeWidth={2} style={{ flexShrink: 0 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: 13 }}>
                    {text}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

        </Box>

        {/* Bottom bar */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems="center"
          mt={3}
          pt={2}
          borderTop="1px solid"
          borderColor="divider"
          gap={1}
        >
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            © {new Date().getFullYear()} Intervu. All rights reserved.
          </Typography>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.12em', fontStyle: 'italic' }}>
            Made by experts for future leaders.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;
