import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import useUser from "./common/hooks/useUser";
import { useState } from "react";
import BankSelection from "./features/profiles/coach/page/BankSelection";

function App() {
    const user = useUser();
    const [bankId, setBankId] = useState(null);

    return (
        <div>
            <h1>Hello World</h1>
            {user && (
                <Button variant="contained" color="primary" LinkComponent={Link} to={`/test/${user.id}`}>
                    Fetch your profile
                </Button>
            )}
            <Button
                variant="contained"
                color="secondary"
                LinkComponent={Link}
                to={"/interview"}
                style={{ marginLeft: 16 }}
            >
                Interview Rooms
            </Button>
            <Button
                variant="contained"
                color="secondary"
                LinkComponent={Link}
                to={"/signup"}
                style={{ marginLeft: 16 }}
            >
                Signup
            </Button>
            <Button variant="contained" color="secondary" LinkComponent={Link} to={"/login"} style={{ marginLeft: 16 }}>
                Login
            </Button>
            <BankSelection bankId={bankId} onBankIdChange={setBankId} />
        </div>
    );
}

export default App;
