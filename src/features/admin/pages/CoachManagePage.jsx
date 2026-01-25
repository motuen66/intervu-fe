import { useState } from "react";
import CreateInterviewerProfileDialog from "../../profiles/coach/page/CreateInterviewerProfileDialog";
import { Button, Typography } from "@mui/material";

function InterviewerManagePage() {
    const [openDialog, setOpenDialog] = useState(false);

    return (
        <>
            <Typography variant="h5" gutterBottom>
                Interviewer Manage Page
            </Typography>
            <Button variant="contained" onClick={() => setOpenDialog(true)}>
                Create Interviewer
            </Button>

            <CreateInterviewerProfileDialog open={openDialog} onClose={() => setOpenDialog(false)} />
        </>
    );
}

export default InterviewerManagePage;
