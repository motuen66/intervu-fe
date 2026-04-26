import { Link } from "react-router-dom";
import useUser from "./common/hooks/useUser";
import { useState } from "react";
import BankSelection from "./features/profiles/coach/page/BankSelection";
import Box from "@mui/material/Box";
import { PrimaryButton, SecondaryButton } from "./common/components/buttons";

function App() {
    const user = useUser();
    const [bankId, setBankId] = useState(null);

    return (
        <div>
            <h1>Hello World</h1>
            {user && (
                <PrimaryButton LinkComponent={Link} to={`/test/${user.id}`}>
                    Fetch your profile
                </PrimaryButton>
            )}
            <Box sx={{ ml: 2, display: "inline-flex", gap: 2 }}>
                <SecondaryButton LinkComponent={Link} to={"/interview"}>
                    Interview Rooms
                </SecondaryButton>
                <SecondaryButton LinkComponent={Link} to={"/signup"}>
                    Signup
                </SecondaryButton>
                <SecondaryButton LinkComponent={Link} to={"/login"}>
                    Login
                </SecondaryButton>
            </Box>
            <BankSelection selectedBin={bankId} onBankBinChange={setBankId} />
        </div>
    );
}

export default App;
