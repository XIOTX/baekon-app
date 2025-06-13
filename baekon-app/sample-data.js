// Sample data for testing the freeform board system
// You can use this to add test boxes to the database

const sampleWorkBoxes = [
  {
    title: "Project Alpha Launch",
    content: "Q2 deadline\nCoordinate with design team\nPrepare marketing materials\nConduct user testing",
    category: "Active Projects",
    priority: "HIGH",
    tags: ["project", "launch", "deadline"]
  },
  {
    title: "Team Meeting Notes",
    content: "Weekly standup\nDiscuss sprint goals\nReview roadmap priorities\nAssign action items",
    category: "Meetings",
    priority: "MEDIUM",
    tags: ["meeting", "team", "standup"]
  },
  {
    title: "UI/UX Research",
    content: "User feedback analysis\nCompetitor research\nDesign system updates\nAccessibility improvements",
    category: "Research",
    priority: "MEDIUM",
    tags: ["research", "design", "user-experience"]
  },
  {
    title: "Code Review Process",
    content: "Establish review guidelines\nSet up automated testing\nDefine merge criteria\nTraining for junior devs",
    category: "Development",
    priority: "HIGH",
    tags: ["code", "process", "quality"]
  },
  {
    title: "Client Onboarding",
    content: "Welcome package preparation\nInitial consultation scheduling\nContract review\nProject kickoff meeting",
    category: "Client Work",
    priority: "HIGH",
    tags: ["client", "onboarding", "process"]
  },
  {
    title: "Learning Goals",
    content: "React 18 features\nTypeScript advanced patterns\nSystem design principles\nAI/ML fundamentals",
    category: "Personal Development",
    priority: "LOW",
    tags: ["learning", "skills", "development"]
  },
  {
    title: "Office Setup",
    content: "New monitor setup\nErgonomic chair adjustment\nCable management\nLighting optimization",
    category: "Workspace",
    priority: "LOW",
    tags: ["office", "setup", "ergonomics"]
  }
];

const sampleLifeBoxes = [
  {
    title: "Weekend Trip Planning",
    content: "Research destinations\nBook accommodations\nPlan activities\nPack essentials",
    category: "Travel",
    priority: "MEDIUM",
    tags: ["travel", "planning", "weekend"]
  },
  {
    title: "Fitness Goals",
    content: "Morning workout routine\n5K run preparation\nProtein intake tracking\nSleep schedule optimization",
    category: "Health",
    priority: "HIGH",
    tags: ["fitness", "health", "goals"]
  },
  {
    title: "Book Reading List",
    content: "The Design of Everyday Things\nAtomic Habits\nThinking Fast and Slow\nThe Pragmatic Programmer",
    category: "Learning",
    priority: "MEDIUM",
    tags: ["books", "reading", "learning"]
  },
  {
    title: "Recipe Collection",
    content: "Thai green curry\nHomemade pasta\nVegan chocolate cake\nMeal prep containers",
    category: "Cooking",
    priority: "LOW",
    tags: ["recipes", "cooking", "food"]
  },
  {
    title: "Family Events",
    content: "Mom's birthday planning\nFamily reunion scheduling\nHoliday traditions\nPhoto album organization",
    category: "Family",
    priority: "HIGH",
    tags: ["family", "events", "planning"]
  },
  {
    title: "Home Improvements",
    content: "Kitchen backsplash\nGarden landscaping\nSmart home setup\nOrganization systems",
    category: "Home",
    priority: "MEDIUM",
    tags: ["home", "improvement", "projects"]
  },
  {
    title: "Financial Planning",
    content: "Budget review\nInvestment portfolio\nEmergency fund goals\nRetirement planning",
    category: "Finance",
    priority: "HIGH",
    tags: ["finance", "planning", "goals"]
  },
  {
    title: "Creative Projects",
    content: "Photography portfolio\nMusic composition\nWriting short stories\nDigital art practice",
    category: "Creative",
    priority: "LOW",
    tags: ["creative", "art", "hobbies"]
  }
];

// Instructions for adding this data:
// 1. Navigate to your Work or Life view
// 2. Use the "Add New Box" button to create boxes
// 3. Copy the title and content from above
// 4. Set the appropriate category and priority
// 5. Test the board view with drag and drop
// 6. Try connecting related boxes with Shift+click

console.log("Sample data ready to be added to the freeform board system");
