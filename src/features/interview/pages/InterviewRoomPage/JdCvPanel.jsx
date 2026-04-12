import { useEffect, useState } from "react";
import { Box, Typography, Tabs, Tab, Stack, Link, Button } from "@mui/material";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import { ROLES } from "../../../../common/constants/common.js";
import EvaluationForm from "./EvaluationForm";

const IMAGE_EXT_REGEX = /\.(png|jpe?g|gif|webp|bmp|svg|avif)(\?.*)?$/i;
const PDF_EXT_REGEX = /\.pdf(\?.*)?$/i;

function normalizeGoogleDrivePreviewUrl(rawUrl) {
    const safeUrl = (rawUrl ?? "").trim();
    if (!safeUrl) return "";

    try {
        const parsed = new URL(safeUrl);
        if (!/drive\.google\.com$/i.test(parsed.hostname)) {
            return safeUrl;
        }

        const filePathMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/i);
        if (filePathMatch?.[1]) {
            return `https://drive.google.com/uc?export=view&id=${filePathMatch[1]}`;
        }

        const id = parsed.searchParams.get("id");
        if (id) {
            return `https://drive.google.com/uc?export=view&id=${id}`;
        }
    } catch {
        return safeUrl;
    }

    return safeUrl;
}

function isLikelyImageUrl(url) {
    if (!url) return false;
    if (url.startsWith("data:image/")) return true;
    if (IMAGE_EXT_REGEX.test(url)) return true;

    try {
        const parsed = new URL(url);
        return /drive\.google\.com$/i.test(parsed.hostname) && !!parsed.searchParams.get("id");
    } catch {
        return false;
    }
}

function extractGoogleDriveFileId(rawUrl) {
    const safeUrl = (rawUrl ?? "").trim();
    if (!safeUrl) return null;

    try {
        const parsed = new URL(safeUrl);
        if (!/drive\.google\.com$/i.test(parsed.hostname)) return null;

        const filePathMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/i);
        if (filePathMatch?.[1]) return filePathMatch[1];

        const id = parsed.searchParams.get("id");
        if (id) return id;
    } catch {
        return null;
    }

    return null;
}

function getInlineDocumentPreviewUrl(rawUrl) {
    const safeUrl = (rawUrl ?? "").trim();
    if (!safeUrl) return "";

    const driveFileId = extractGoogleDriveFileId(safeUrl);
    if (driveFileId) {
        return `https://drive.google.com/file/d/${driveFileId}/preview`;
    }

    if (PDF_EXT_REGEX.test(safeUrl)) {
        return safeUrl;
    }

    return "";
}

export function JdCvPanel({ roomId, user, jobDescriptionUrl, cvUrl }) {
    const [tab, setTab] = useState(0);

    return (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                    borderBottom: "1px solid #E5E7EB",
                    minHeight: 40,
                    flexShrink: 0,
                    "& .MuiTab-root": {
                        minWidth: "auto",
                        px: 1.5,
                        py: 0,
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        minHeight: 40,
                    },
                }}
            >
                <Tab label="Job Description" />
                <Tab label="Candidate CV" />
                {user?.role !== ROLES.CANDIDATE && <Tab label="Evaluate" />}
            </Tabs>

            <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
                {/* Tab 0: Job Description */}
                {tab === 0 && <DocumentLinkTab url={jobDescriptionUrl} emptyText="Job Description was not provided." />}

                {/* Tab 1: Candidate CV */}
                {tab === 1 && <DocumentLinkTab url={cvUrl} emptyText="CV was not provided." />}

                {/* Tab 2: Evaluate */}
                {tab === 2 && user?.role !== ROLES.CANDIDATE && <EvaluateTab roomId={roomId} user={user} />}
            </Box>
        </Box>
    );
}

function DocumentLinkTab({ title, url, emptyText, icon }) {
    const inputUrl = (url ?? "").trim();
    const resolvedUrl = normalizeGoogleDrivePreviewUrl(inputUrl);
    const hasLink = resolvedUrl.length > 0;
    const [imageLoadFailed, setImageLoadFailed] = useState(false);

    useEffect(() => {
        setImageLoadFailed(false);
    }, [resolvedUrl]);

    const showImagePreview = hasLink && isLikelyImageUrl(resolvedUrl) && !imageLoadFailed;
    const inlineDocumentPreviewUrl = showImagePreview ? "" : getInlineDocumentPreviewUrl(inputUrl);

    return (
        <Stack spacing={2.5}>
            <Stack direction="row" spacing={1} alignItems="center">
                {icon}
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>
                    {title}
                </Typography>
            </Stack>

            {hasLink ? (
                showImagePreview ? (
                    <Stack spacing={1.5}>
                        <Box
                            sx={{
                                p: 1,
                                borderRadius: "10px",
                                border: "1px solid #E5E7EB",
                                bgcolor: "#F8FAFC",
                            }}
                        >
                            <Box
                                component="img"
                                src={resolvedUrl}
                                alt={`${title} preview`}
                                onError={() => setImageLoadFailed(true)}
                                sx={{
                                    width: "100%",
                                    maxHeight: 520,
                                    objectFit: "contain",
                                    display: "block",
                                    borderRadius: "8px",
                                    bgcolor: "#FFFFFF",
                                }}
                            />
                        </Box>
                    </Stack>
                ) : inlineDocumentPreviewUrl ? (
                    <Stack spacing={1.5}>
                        <Box
                            sx={{
                                borderRadius: "10px",
                                border: "1px solid #E5E7EB",
                                overflow: "hidden",
                                bgcolor: "#F8FAFC",
                                height: 520,
                            }}
                        >
                            <Box
                                component="iframe"
                                src={inlineDocumentPreviewUrl}
                                title={`${title} preview`}
                                sx={{
                                    width: "100%",
                                    height: "100%",
                                    border: "none",
                                }}
                                allow="autoplay"
                            />
                        </Box>
                        <Typography variant="caption" sx={{ color: "#6B7280" }}>
                            Showing inline preview in current tab.
                        </Typography>
                    </Stack>
                ) : (
                    <Stack spacing={1.5}>
                        <Box
                            sx={{
                                p: 1.5,
                                borderRadius: "10px",
                                border: "1px solid #E5E7EB",
                                bgcolor: "#F8FAFC",
                            }}
                        >
                            <Link
                                href={resolvedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                underline="hover"
                                sx={{
                                    color: "#1D4ED8",
                                    fontWeight: 600,
                                    wordBreak: "break-all",
                                }}
                            >
                                {inputUrl}
                            </Link>
                        </Box>
                        <Button
                            variant="contained"
                            href={resolvedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            endIcon={<OpenInNewIcon />}
                            sx={{
                                width: "fit-content",
                                textTransform: "none",
                                borderRadius: "10px",
                                bgcolor: "#0F172A",
                                "&:hover": { bgcolor: "#1E293B" },
                            }}
                        >
                            Open Link
                        </Button>
                    </Stack>
                )
            ) : (
                <Stack spacing={1.25} alignItems="center" sx={{ py: 5 }}>
                    <LinkOffIcon sx={{ color: "#9CA3AF", fontSize: 34 }} />
                    <Typography variant="body2" sx={{ color: "#6B7280", textAlign: "center", maxWidth: 320 }}>
                        {emptyText}
                    </Typography>
                </Stack>
            )}
        </Stack>
    );
}

function EvaluateTab({ roomId, user }) {
    if (user?.role !== ROLES.CANDIDATE) {
        return <EvaluationForm roomId={roomId} />;
    }
}
