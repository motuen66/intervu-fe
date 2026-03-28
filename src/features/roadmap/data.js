export const roadmapData = {
    roadmap_metadata: {
        target_role: "Frontend",
        target_level: "Junior",
        total_phases: 4,
    },
    phases: [
        {
            phase_id: "phase1",
            phase_name: "Foundations & Remediation",
            nodes: [
                {
                    skill_id: "data_persistence",
                    skill_name: "Data Architecture & Persistence",
                    assessment: {
                        current_level: "Basic",
                        target_level: "Intermediate",
                        sfia_level: 2,
                        status: "Weak",
                        progress: 33,
                    },
                    child_skills: ["ORM and Data Access", "PostgreSQL"],
                    mentor_note:
                        "Your database design experience will be valuable as you learn how to interact with data using ORM tools.",
                },
                {
                    skill_id: "system_observability",
                    skill_name: "System Observability",
                    assessment: {
                        current_level: "Basic",
                        target_level: "Intermediate",
                        sfia_level: 2,
                        status: "Weak",
                        progress: 33,
                    },
                    child_skills: ["Logging and Monitoring"],
                    mentor_note:
                        "Building on your existing logging knowledge, you'll learn to proactively monitor system health.",
                },
                {
                    skill_id: "deployment_basics",
                    skill_name: "Deployment & Infrastructure",
                    assessment: {
                        current_level: "Comfortable",
                        target_level: "Intermediate",
                        sfia_level: 2,
                        status: "Weak",
                        progress: 33,
                    },
                    child_skills: ["Containerization and Deployment", "System Integration"],
                    mentor_note:
                        "Your system integration experience will help you understand how to deploy and connect different components.",
                },
            ],
        },
        {
            phase_id: "phase2",
            phase_name: "Core Tech & Frontend Specialization",
            nodes: [
                {
                    skill_id: "react_fundamentals",
                    skill_name: "Modern Web Foundations",
                    assessment: {
                        current_level: "None",
                        target_level: "Intermediate",
                        sfia_level: 2,
                        status: "Missing",
                        progress: 0,
                    },
                    child_skills: ["React", "TypeScript"],
                    mentor_note: "Leverage your REST API experience to build dynamic frontend applications with React.",
                },
                {
                    skill_id: "api_integration",
                    skill_name: "API Design & Integration",
                    assessment: {
                        current_level: "Intermediate",
                        target_level: "Intermediate",
                        sfia_level: 2,
                        status: "Complete",
                        progress: 100,
                    },
                    child_skills: ["REST API Development"],
                    mentor_note:
                        "Your existing REST API skills will be directly applicable to fetching and displaying data in your React applications.",
                },
            ],
        },
        {
            phase_id: "phase3",
            phase_name: "Advanced Frontend Architecture",
            nodes: [
                {
                    skill_id: "performance_optimization",
                    skill_name: "Application Performance",
                    assessment: {
                        current_level: "Intermediate",
                        target_level: "Intermediate",
                        sfia_level: 2,
                        status: "Complete",
                        progress: 100,
                    },
                    child_skills: ["Performance Optimization"],
                    mentor_note:
                        "Your existing performance optimization skills will be crucial for building responsive and efficient frontend applications.",
                },
                {
                    skill_id: "security_fundamentals",
                    skill_name: "Application Security",
                    assessment: {
                        current_level: "None",
                        target_level: "Intermediate",
                        sfia_level: 2,
                        status: "Missing",
                        progress: 0,
                    },
                    child_skills: ["Authentication and Authorization"],
                    mentor_note:
                        "Understanding security principles is essential for protecting user data and ensuring application integrity.",
                },
            ],
        },
        {
            phase_id: "phase4",
            phase_name: "Production Readiness & Career Simulation",
            nodes: [
                {
                    skill_id: "scalability_concurrency",
                    skill_name: "Scalability & Concurrency",
                    assessment: {
                        current_level: "Beginner",
                        target_level: "Intermediate",
                        sfia_level: 2,
                        status: "Missing",
                        progress: 0,
                    },
                    child_skills: ["Concurrency and Scalability"],
                    mentor_note:
                        "Your experience with message queue processing will provide a foundation for understanding concurrent systems.",
                },
                {
                    skill_id: "caching_strategies",
                    skill_name: "Caching & Data Management",
                    assessment: {
                        current_level: "Basic",
                        target_level: "Intermediate",
                        sfia_level: 2,
                        status: "Weak",
                        progress: 33,
                    },
                    child_skills: ["Caching"],
                    mentor_note:
                        "Building on your database knowledge, you'll learn how to optimize data retrieval using caching techniques.",
                },
            ],
        },
    ],
};
