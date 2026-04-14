import React from 'react';
import { Box, Typography } from '@mui/material';
import './CommonLoader.css';
import loaderImg from '../../../assets/illustrations/interviewer-loader-3d.png';

/**
 * CommonLoader - Shared premium loader UI for pages and global loading gate.
 * @param {string} text - Main message
 * @param {string} subtext - Supporting message
 */
const CommonLoader = ({
  text = "Loading",
  subtext = "Getting things ready for you...",
}) => {
  return (
    <Box className="common-loader-container">
      <Box className="loader-avatar-wrapper">
        <Box className="loader-avatar-circle">
          <img
            src={loaderImg}
            alt="Interviewer Loading"
            className="loader-image"
          />
        </Box>
      </Box>

      <Typography variant="h6" className="loader-text">
        {text}
      </Typography>

      <Typography variant="body2" className="loader-subtext">
        {subtext}
      </Typography>
    </Box>
  );
};

export default CommonLoader;
