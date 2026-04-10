import { Link } from "react-router-dom";
import useUser from "./common/hooks/useUser";
import { useState } from "react";
import BankSelection from "./features/profiles/coach/page/BankSelection";
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
            <SecondaryButton LinkComponent={Link} to={"/interview"} sx={{ ml: 2 }}>
                Interview Rooms
            </SecondaryButton>
            <SecondaryButton LinkComponent={Link} to={"/signup"} sx={{ ml: 2 }}>
                Signup
            </SecondaryButton>
            <SecondaryButton LinkComponent={Link} to={"/login"} sx={{ ml: 2 }}>
                Login
            </SecondaryButton>
            <BankSelection selectedBin={bankId} onBankBinChange={setBankId} />
        </div>
    );
}

export default App;
