import { useState } from "react";
import CreateInterviewerProfileDialog from "../../profiles/coach/page/CreateInterviewerProfileDialog";
import { Typography } from "@mui/material";
import { PrimaryButton } from "../../../common/components/buttons";

function InterviewerManagePage() {
    const [openDialog, setOpenDialog] = useState(false);

    return (
        <>
            <Typography variant="h5" gutterBottom>
                Interviewer Manage Page
            </Typography>
            <PrimaryButton onClick={() => setOpenDialog(true)}>
                Create Interviewer
            </PrimaryButton>

            <CreateInterviewerProfileDialog open={openDialog} onClose={() => setOpenDialog(false)} />
        </>
    );
}

export default InterviewerManagePage;
