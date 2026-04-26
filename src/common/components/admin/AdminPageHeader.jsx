import PageHeader from "../PageHeader";

export default function AdminPageHeader({ title, subtitle, actionButton }) {
    return <PageHeader title={title} subtitle={subtitle} actions={actionButton} />;
}
