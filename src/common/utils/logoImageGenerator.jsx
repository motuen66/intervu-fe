import { useState } from "react";
import { Avatar, Box } from "@mui/material";
import { COMPANY_DOMAINS } from "../constants/types";

const LOGO_API_KEY = import.meta.env.VITE_APP_LOGO_API_KEY;
export function CompanyLogo({ name, size = 20 }) {
    const domain = COMPANY_DOMAINS[name] || name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";

    const [err, setErr] = useState(false);

    return err ? (
        <Avatar
            sx={{
                width: size,
                height: size,
                fontSize: size * 0.5,
                bgcolor: "grey.300",
                color: "text.primary",
            }}
        >
            {name?.[0]?.toUpperCase()}
        </Avatar>
    ) : (
        <Box
            component="img"
            src={`https://img.logo.dev/${domain}?token=${LOGO_API_KEY}`}
            alt={name}
            onError={() => setErr(true)}
            sx={{
                width: size,
                height: size,
                borderRadius: 0.5,
                objectFit: "contain",
                flexShrink: 0,
            }}
        />
    );
}
