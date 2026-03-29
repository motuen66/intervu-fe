export const roadmapData = {
    roadmap_metadata: {
        target_role: "Frontend Developer",
        target_level: "Junior",
        total_phases: 4,
    },
    phases: [
        {
            phase_id: "phase1",
            phase_name: "Phase 1: Foundations & Remediation",
            recommended_coaches: [
                {
                    id: "c1",
                    name: "Lê Anh Đức",
                    role: "Senior Backend Engineer @ FPT",
                    rating: 4.9,
                    avatar: "https://i.pravatar.cc/150?u=c1",
                },
                {
                    id: "c2",
                    name: "Nguyễn Minh Hùng",
                    role: "DevOps Architect",
                    rating: 4.8,
                    avatar: "https://i.pravatar.cc/150?u=c2",
                },
            ],
            mock_history: [
                {
                    mock_id: "m101",
                    mock_title: "Backend Foundation Drill",
                    interview_type: "Technical Interview",
                    coach_name: "Lê Anh Đức",
                    interviewed_at: "2026-03-04",
                    evaluation: [
                        {
                            type: "Problem Solving & Logic",
                            score: 7,
                            answer: "Ứng viên có tư duy logic khá tốt, biết cách chia nhỏ bài toán. Tuy nhiên, cần chú ý hơn đến các edge case liên quan đến dữ liệu null hoặc rỗng.",
                            question:
                                "How would you evaluate the candidate's ability to analyze requirements, clarify edge cases, and approach the problem logically before writing code?",
                        },
                        {
                            type: "Code Quality & Optimization",
                            score: 6,
                            answer: "Code rõ ràng nhưng đặt tên biến còn hơi ngắn. Chưa tối ưu được độ phức tạp thời gian trong vòng lặp lồng nhau, cần chú ý Big O.",
                            question:
                                "Rate the candidate's code quality (clean code principles, naming conventions) and their ability to optimize for time and space complexity (Big O).",
                        },
                        {
                            type: "Tech Stack & Fundamentals",
                            score: 8,
                            answer: "Nắm vững kiến thức về OOP và SQL. Hiểu rõ cách hoạt động của Dependency Injection trong .NET Core.",
                            question:
                                "Assess the candidate's grasp of core computer science fundamentals (OOP, Databases, System Design) and their proficiency in their primary tech stack/framework.",
                        },
                        {
                            type: "Actionable Tech Advice",
                            score: 7,
                            answer: "Nên tập trung học thêm về: 1. Unit Testing cơ bản, 2. Tối ưu truy vấn SQL (Indexing), 3. SOLID principles.",
                            question:
                                "Where are the candidate's technical blind spots? Please list 1-3 specific technologies, concepts, or keywords they must study to improve.",
                        },
                    ],
                },
                {
                    mock_id: "m102",
                    mock_title: "Observability Simulation",
                    interview_type: "System Design",
                    coach_name: "Nguyễn Minh Hùng",
                    interviewed_at: "2026-03-10",
                    evaluation: [
                        {
                            type: "Problem Solving & Logic",
                            score: 6,
                            answer: "Cách tiếp cận hệ thống phân tán còn hơi lúng túng khi gặp vấn đề về race condition. Cần rèn luyện thêm khả năng đặt câu hỏi làm rõ yêu cầu.",
                            question:
                                "How would you evaluate the candidate's ability to analyze requirements, clarify edge cases, and approach the problem logically before writing code?",
                        },
                        {
                            type: "Code Quality & Optimization",
                            score: 7,
                            answer: "Sử dụng tốt các pattern cho logging và monitoring. Code dễ bảo trì và có tính module hóa cao.",
                            question:
                                "Rate the candidate's code quality (clean code principles, naming conventions) and their ability to optimize for time and space complexity (Big O).",
                        },
                        {
                            type: "Tech Stack & Fundamentals",
                            score: 5,
                            answer: "Kiến thức về Microservices và Observability (Tracing/Metrics) còn ở mức bề nổi, chưa hiểu sâu về cơ chế hạ tầng.",
                            question:
                                "Assess the candidate's grasp of core computer science fundamentals (OOP, Databases, System Design) and their proficiency in their primary tech stack/framework.",
                        },
                        {
                            type: "Actionable Tech Advice",
                            score: 6,
                            answer: "Cần nghiên cứu: 1. ELK Stack, 2. Distributed Tracing (Jaeger), 3. Prometheus & Grafana.",
                            question:
                                "Where are the candidate's technical blind spots? Please list 1-3 specific technologies, concepts, or keywords they must study to improve.",
                        },
                    ],
                },
            ],
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
                    child_skills: [
                        {
                            name: "ORM and Data Access",
                            questions: [
                                {
                                    id: "q101",
                                    title: "Explain Lazy Loading vs Eager Loading in ORM",
                                    difficulty: "Medium",
                                },
                                {
                                    id: "q102",
                                    title: "N+1 Problem: What is it and how to solve it?",
                                    difficulty: "Hard",
                                },
                            ],
                        },
                        {
                            name: "PostgreSQL Mastery",
                            questions: [
                                { id: "q103", title: "Explain ACID properties in PostgreSQL", difficulty: "Medium" },
                                { id: "q104", title: "How do Indexes speed up queries?", difficulty: "Easy" },
                            ],
                        },
                    ],
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
                    child_skills: [
                        {
                            name: "Logging & Monitoring",
                            questions: [
                                {
                                    id: "q105",
                                    title: "What are Structured Logs and why use them?",
                                    difficulty: "Medium",
                                },
                                {
                                    id: "q106",
                                    title: "Difference between Metrics, Logs, and Traces",
                                    difficulty: "Hard",
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            phase_id: "phase2",
            phase_name: "Phase 2: Core Tech & Frontend Specialization",
            recommended_coaches: [
                {
                    id: "c3",
                    name: "Trần Việt Hoàng",
                    role: "Frontend Lead @ VinID",
                    rating: 5.0,
                    avatar: "https://i.pravatar.cc/150?u=c3",
                },
                {
                    id: "c4",
                    name: "Phạm Thu Thảo",
                    role: "Senior React Developer",
                    rating: 4.7,
                    avatar: "https://i.pravatar.cc/150?u=c4",
                },
            ],
            mock_history: [
                {
                    mock_id: "m201",
                    mock_title: "React Core Interview",
                    interview_type: "Technical Interview",
                    coach_name: "Trần Việt Hoàng",
                    interviewed_at: "2026-03-12",
                    evaluation: [
                        {
                            type: "Problem Solving & Logic",
                            score: 8,
                            answer: "Xử lý tốt các bài toán về state management. Biết cách tối ưu render để tránh re-render không cần thiết.",
                            question:
                                "How would you evaluate the candidate's ability to analyze requirements, clarify edge cases, and approach the problem logically before writing code?",
                        },
                        {
                            type: "Code Quality & Optimization",
                            score: 9,
                            answer: "Code rất sạch, tuân thủ chặt chẽ các quy tắc của React Hooks. Sử dụng useMemo và useCallback đúng chỗ.",
                            question:
                                "Rate the candidate's code quality (clean code principles, naming conventions) and their ability to optimize for time and space complexity (Big O).",
                        },
                        {
                            type: "Tech Stack & Fundamentals",
                            score: 9,
                            answer: "Hiểu sâu về Virtual DOM và cơ chế Reconciliation của React. Nắm vững ES6+.",
                            question:
                                "Assess the candidate's grasp of core computer science fundamentals (OOP, Databases, System Design) and their proficiency in their primary tech stack/framework.",
                        },
                        {
                            type: "Actionable Tech Advice",
                            score: 8,
                            answer: "Nên tìm hiểu thêm về: 1. React Server Components, 2. Micro-frontends cơ bản.",
                            question:
                                "Where are the candidate's technical blind spots? Please list 1-3 specific technologies, concepts, or keywords they must study to improve.",
                        },
                    ],
                },
                {
                    mock_id: "m202",
                    mock_title: "Frontend API Integration Round",
                    interview_type: "Practical Session",
                    coach_name: "Phạm Thu Thảo",
                    interviewed_at: "2026-03-16",
                    evaluation: [
                        {
                            type: "Problem Solving & Logic",
                            score: 7,
                            answer: "Xử lý bất đồng bộ tốt. Tuy nhiên cần cẩn thận hơn với việc xử lý lỗi (error boundary) khi API gọi thất bại.",
                            question:
                                "How would you evaluate the candidate's ability to analyze requirements, clarify edge cases, and approach the problem logically before writing code?",
                        },
                        {
                            type: "Code Quality & Optimization",
                            score: 8,
                            answer: "Tổ chức code API layer rõ ràng, tách biệt logic phỏng vấn và render. Sử dụng tốt TypeScript để định nghĩa kiểu dữ liệu trả về.",
                            question:
                                "Rate the candidate's code quality (clean code principles, naming conventions) and their ability to optimize for time and space complexity (Big O).",
                        },
                        {
                            type: "Tech Stack & Fundamentals",
                            score: 7,
                            answer: "Thành thạo Axios và Fetch API. Có hiểu biết về RESTful nhưng cần nắm thêm về GraphQL.",
                            question:
                                "Assess the candidate's grasp of core computer science fundamentals (OOP, Databases, System Design) and their proficiency in their primary tech stack/framework.",
                        },
                        {
                            type: "Actionable Tech Advice",
                            score: 8,
                            answer: "Học thêm: 1. React Query cho caching, 2. Web Sockets cho real-time data.",
                            question:
                                "Where are the candidate's technical blind spots? Please list 1-3 specific technologies, concepts, or keywords they must study to improve.",
                        },
                    ],
                },
            ],
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
                    child_skills: [
                        {
                            name: "React Core",
                            questions: [
                                { id: "q201", title: "Explain the React Component Lifecycle", difficulty: "Medium" },
                                { id: "q202", title: "How does the Virtual DOM work?", difficulty: "Medium" },
                            ],
                        },
                        {
                            name: "TypeScript Integration",
                            questions: [
                                { id: "q203", title: "Benefits of using TS with React", difficulty: "Easy" },
                                { id: "q204", title: "Utility Types: Pick, Omit, Partial", difficulty: "Hard" },
                            ],
                        },
                    ],
                },
                {
                    skill_id: "api_design_fe",
                    skill_name: "API Design & Integration",
                    assessment: {
                        current_level: "Intermediate",
                        target_level: "Intermediate",
                        sfia_level: 2,
                        status: "Complete",
                        progress: 100,
                    },
                    child_skills: [
                        {
                            name: "RESTful Patterns",
                            questions: [{ id: "q205", title: "Designing idempotent APIs", difficulty: "Hard" }],
                        },
                    ],
                },
            ],
        },
        {
            phase_id: "phase3",
            phase_name: "Phase 3: Advanced Frontend Architecture",
            recommended_coaches: [
                {
                    id: "c5",
                    name: "Ngô Quốc Huy",
                    role: "Solution Architect",
                    rating: 4.9,
                    avatar: "https://i.pravatar.cc/150?u=c5",
                },
            ],
            mock_history: [
                {
                    mock_id: "m301",
                    mock_title: "Performance Architecture Mock",
                    interview_type: "System Design",
                    coach_name: "Ngô Quốc Huy",
                    interviewed_at: "2026-03-18",
                    evaluation: [
                        {
                            type: "Problem Solving & Logic",
                            score: 6,
                            answer: "Xác định được các điểm nghẽn hiệu năng nhưng các giải pháp đề xuất còn mang tính lý thuyết, chưa sát thực tế ứng dụng lớn.",
                            question:
                                "How would you evaluate the candidate's ability to analyze requirements, clarify edge cases, and approach the problem logically before writing code?",
                        },
                        {
                            type: "Code Quality & Optimization",
                            score: 7,
                            answer: "Code tốt trong việc tối ưu bundle size thông qua code splitting. Tuy nhiên chưa áp dụng tốt các kỹ thuật lazy load cho tài nguyên tĩnh.",
                            question:
                                "Rate the candidate's code quality (clean code principles, naming conventions) and their ability to optimize for time and space complexity (Big O).",
                        },
                        {
                            type: "Tech Stack & Fundamentals",
                            score: 6,
                            answer: "Hiểu về Web Vitals nhưng chưa biết cách sử dụng các công cụ profiling chuyên sâu như Chrome DevTools Performance tab hiệu quả.",
                            question:
                                "Assess the candidate's grasp of core computer science fundamentals (OOP, Databases, System Design) and their proficiency in their primary tech stack/framework.",
                        },
                        {
                            type: "Actionable Tech Advice",
                            score: 7,
                            answer: "Cần tập trung vào: 1. Lighthouse CI, 2. Image Optimization strategies, 3. Critical CSS rendering.",
                            question:
                                "Where are the candidate's technical blind spots? Please list 1-3 specific technologies, concepts, or keywords they must study to improve.",
                        },
                    ],
                },
                {
                    mock_id: "m302",
                    mock_title: "Security Scenario Interview",
                    interview_type: "Behavioral + Technical",
                    coach_name: "Ngô Quốc Huy",
                    interviewed_at: "2026-03-22",
                    evaluation: [
                        {
                            type: "Problem Solving & Logic",
                            score: 8,
                            answer: "Phản xạ nhanh với các tình huống giả định về lỗ hổng XSS. Tư duy phòng thủ tốt trong thiết kế UI.",
                            question:
                                "How would you evaluate the candidate's ability to analyze requirements, clarify edge cases, and approach the problem logically before writing code?",
                        },
                        {
                            type: "Code Quality & Optimization",
                            score: 8,
                            answer: "Code xử lý form và input được sanitize cẩn thận. Sử dụng tốt các thư viện validation để chặn dữ liệu xấu ngay từ client.",
                            question:
                                "Rate the candidate's code quality (clean code principles, naming conventions) and their ability to optimize for time and space complexity (Big O).",
                        },
                        {
                            type: "Tech Stack & Fundamentals",
                            score: 7,
                            answer: "Nắm vững cơ chế JWT. Cần tìm hiểu kỹ hơn về chính sách Same-Origin Policy và CORS nâng cao.",
                            question:
                                "Assess the candidate's grasp of core computer science fundamentals (OOP, Databases, System Design) and their proficiency in their primary tech stack/framework.",
                        },
                        {
                            type: "Actionable Tech Advice",
                            score: 8,
                            answer: "Nghiên cứu thêm: 1. Content Security Policy (CSP), 2. OAuth2/OpenID Connect flows.",
                            question:
                                "Where are the candidate's technical blind spots? Please list 1-3 specific technologies, concepts, or keywords they must study to improve.",
                        },
                    ],
                },
            ],
            nodes: [
                {
                    skill_id: "app_performance",
                    skill_name: "Application Performance",
                    assessment: {
                        current_level: "Intermediate",
                        target_level: "Intermediate",
                        sfia_level: 2,
                        status: "Complete",
                        progress: 100,
                    },
                    child_skills: [
                        {
                            name: "Frontend Optimization",
                            questions: [
                                {
                                    id: "q301",
                                    title: "What is Code Splitting and how to implement it?",
                                    difficulty: "Hard",
                                },
                                { id: "q302", title: "Optimizing Core Web Vitals", difficulty: "Hard" },
                            ],
                        },
                    ],
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
                    child_skills: [
                        {
                            name: "Frontend Auth Flow",
                            questions: [
                                { id: "q303", title: "XSS vs CSRF: Prevention techniques", difficulty: "Hard" },
                                { id: "q304", title: "Securing JWT in LocalStorage vs Cookies", difficulty: "Medium" },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            phase_id: "phase4",
            phase_name: "Phase 4: Production Readiness & Simulation",
            recommended_coaches: [
                {
                    id: "c6",
                    name: "Đặng Minh Tuấn",
                    role: "Engineering Manager",
                    rating: 5.0,
                    avatar: "https://i.pravatar.cc/150?u=c6",
                },
            ],
            mock_history: [
                {
                    mock_id: "m401",
                    mock_title: "Scalability & Concurrency Mock",
                    interview_type: "System Design",
                    coach_name: "Đặng Minh Tuấn",
                    interviewed_at: "2026-03-24",
                    evaluation: [
                        {
                            type: "Problem Solving & Logic",
                            score: 7,
                            answer: "Có khả năng thiết kế các component có tính tái sử dụng cao cho hệ thống lớn. Hiểu về tầm quan trọng của Atomic Design.",
                            question:
                                "How would you evaluate the candidate's ability to analyze requirements, clarify edge cases, and approach the problem logically before writing code?",
                        },
                        {
                            type: "Code Quality & Optimization",
                            score: 8,
                            answer: "Code được tổ chức theo kiến trúc sạch (Clean Architecture), dễ mở rộng và kiểm thử.",
                            question:
                                "Rate the candidate's code quality (clean code principles, naming conventions) and their ability to optimize for time and space complexity (Big O).",
                        },
                        {
                            type: "Tech Stack & Fundamentals",
                            score: 7,
                            answer: "Nắm vững Event Loop và Task Queue. Cần tìm hiểu thêm về Web Workers để xử lý các task nặng ở background.",
                            question:
                                "Assess the candidate's grasp of core computer science fundamentals (OOP, Databases, System Design) and their proficiency in their primary tech stack/framework.",
                        },
                        {
                            type: "Actionable Tech Advice",
                            score: 7,
                            answer: "Nên học: 1. Module Federation, 2. Web Workers, 3. State Machines (XState).",
                            question:
                                "Where are the candidate's technical blind spots? Please list 1-3 specific technologies, concepts, or keywords they must study to improve.",
                        },
                    ],
                },
                {
                    mock_id: "m402",
                    mock_title: "Production Readiness Final Mock",
                    interview_type: "Full Loop Interview",
                    coach_name: "Đặng Minh Tuấn",
                    interviewed_at: "2026-03-27",
                    evaluation: [
                        {
                            type: "Problem Solving & Logic",
                            score: 9,
                            answer: "Hoàn thành xuất sắc các thử thách về xử lý dữ liệu lớn trên client. Giải quyết xung đột state một cách thông minh.",
                            question:
                                "How would you evaluate the candidate's ability to analyze requirements, clarify edge cases, and approach the problem logically before writing code?",
                        },
                        {
                            type: "Code Quality & Optimization",
                            score: 9,
                            answer: "Code đạt chuẩn production: có logging, có error handling, tối ưu bundle size và tuân thủ chặt chẽ linter rules.",
                            question:
                                "Rate the candidate's code quality (clean code principles, naming conventions) and their ability to optimize for time and space complexity (Big O).",
                        },
                        {
                            type: "Tech Stack & Fundamentals",
                            score: 8,
                            answer: "Nắm vững toàn bộ hệ sinh thái React. Có tư duy về CI/CD và deployment cho Frontend.",
                            question:
                                "Assess the candidate's grasp of core computer science fundamentals (OOP, Databases, System Design) and their proficiency in their primary tech stack/framework.",
                        },
                        {
                            type: "Actionable Tech Advice",
                            score: 9,
                            answer: "Sẵn sàng cho vai trò Junior+. Cần cải thiện kỹ năng giao tiếp tiếng Anh để làm việc trong môi trường quốc tế.",
                            question:
                                "Where are the candidate's technical blind spots? Please list 1-3 specific technologies, concepts, or keywords they must study to improve.",
                        },
                    ],
                },
            ],
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
                    child_skills: [
                        {
                            name: "Async Patterns",
                            questions: [
                                {
                                    id: "q401",
                                    title: "Handling race conditions in React useEffect",
                                    difficulty: "Hard",
                                },
                                { id: "q402", title: "Event Loop and Task Queue depth", difficulty: "Hard" },
                            ],
                        },
                    ],
                },
                {
                    skill_id: "caching_data_mgmt",
                    skill_name: "Caching & Data Management",
                    assessment: {
                        current_level: "Basic",
                        target_level: "Intermediate",
                        sfia_level: 2,
                        status: "Weak",
                        progress: 33,
                    },
                    child_skills: [
                        {
                            name: "Client-side Caching",
                            questions: [
                                {
                                    id: "q403",
                                    title: "Stale-While-Revalidate pattern with React Query",
                                    difficulty: "Medium",
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
};
