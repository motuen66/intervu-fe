import { Container } from "@mui/material";
import "./AdminDashboard.css";
import "./AdminInterviewsPage.css";
import AdminPageHeader from "../../../common/components/admin/AdminPageHeader";

export default function AdminInterviewsPage() {
    return (
        <Container maxWidth="xl" className="admin-page admin-interviews-page" sx={{ py: 3 }}>
            <AdminPageHeader title="Interviews" subtitle="Monitor interview activity and settings." />

            <div className="admin-card admin-interviews-card">
                <div className="admin-interviews-empty">
                    <h3>Interview overview</h3>
                    <p>Connect interview data here when the API is ready.</p>
                </div>
            </div>
        </Container>
    );
}
